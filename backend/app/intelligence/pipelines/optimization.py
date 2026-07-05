"""
ArogyaOne — OR-Tools Resource Redistribution Engine

NOT a machine learning model. This is a constraint-satisfaction optimiser.
Given a set of hospitals with surplus/deficit of a resource, it finds the
optimal transfer plan that minimises total delivery time while ensuring
no source hospital falls below its own safety threshold post-transfer.
"""

from dataclasses import dataclass, field
from typing import Optional
import math
import logging
import json
import time

from .exceptions import FeatureValidationError

logger = logging.getLogger(__name__)

try:
    from ortools.linear_solver import pywraplp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False
    logger.warning("OR-Tools not installed. Run: pip install ortools")

# ── Configuration Parameters ──────────────────────────────────────────────────
AVG_SPEED_KMH = 40.0
LOADING_TIME_MINS = 15
DEFAULT_MAX_DISTANCE_KM = 50.0

# ── Data types ───────────────────────────────────────────────────────────────

@dataclass
class HospitalNode:
    hospital_id:    str
    hospital_name:  str
    district:       str
    lat:            float
    lon:            float
    current_stock:  float
    min_threshold:  float    # must NOT go below this after transfer
    max_capacity:   float
    urgency_score:  float    # 0–1, derived from LightGBM stockout_days (lower = more urgent)
    hospital_type:  str      # PHC | CHC | DH


@dataclass
class TransferRecommendation:
    source_hospital_id:   str
    source_hospital_name: str
    destination_hospital_id:   str
    destination_hospital_name: str
    resource_name:        str
    transfer_quantity:    float
    distance_km:          float
    estimated_delivery_minutes: int
    source_stock_after:   float
    destination_stock_after: float
    optimisation_reason:  str
    confidence:           float = 1.0


@dataclass
class OptimisationResult:
    feasible:             bool
    recommendations:      list[TransferRecommendation] = field(default_factory=list)
    total_deficit_covered: float = 0.0
    message:              str = ""


# ── Distance utility ─────────────────────────────────────────────────────────

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula — great-circle distance in km."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def estimated_delivery_minutes(distance_km: float) -> int:
    travel_minutes = (distance_km / AVG_SPEED_KMH) * 60
    return int(travel_minutes + LOADING_TIME_MINS)


# ── Validation ───────────────────────────────────────────────────────────────

def _validate_optimisation_inputs(
    deficit_hospital: HospitalNode,
    all_hospitals: list[HospitalNode],
    required_quantity: float
):
    if required_quantity <= 0:
        raise FeatureValidationError(f"required_quantity must be positive. Got: {required_quantity}")

    seen_ids = set()
    for h in all_hospitals:
        if h.hospital_id in seen_ids:
            raise FeatureValidationError(f"Duplicate hospital ID detected: {h.hospital_id}")
        seen_ids.add(h.hospital_id)
        
        if h.current_stock < 0 or h.min_threshold < 0 or h.max_capacity < 0:
            raise FeatureValidationError(f"Hospital {h.hospital_id} has negative stock or capacity values.")
            
        if not (-90.0 <= h.lat <= 90.0) or not (-180.0 <= h.lon <= 180.0):
            raise FeatureValidationError(f"Hospital {h.hospital_id} has invalid coordinates: ({h.lat}, {h.lon})")

    # Ensure deficit hospital is in the list (or at least valid)
    if not (-90.0 <= deficit_hospital.lat <= 90.0) or not (-180.0 <= deficit_hospital.lon <= 180.0):
        raise FeatureValidationError(f"Deficit hospital has invalid coordinates: ({deficit_hospital.lat}, {deficit_hospital.lon})")


# ── Greedy fallback (when OR-Tools unavailable or solver fails) ───────────────

def _greedy_optimise(
    deficit_hospital: HospitalNode,
    surplus_hospitals: list[HospitalNode],
    resource_name: str,
    required_qty: float,
    correlation_id: str
) -> OptimisationResult:
    """
    Greedy heuristic: sort surplus hospitals by a composite score of
    (available surplus / distance). Pick greedily until deficit covered.
    """
    logger.warning("optimization_greedy_fallback", extra={
        "correlation_id": correlation_id,
        "event_message": "Falling back to greedy heuristic due to OR-Tools failure or unavailability."
    })

    candidates = []
    for h in surplus_hospitals:
        available_surplus = h.current_stock - h.min_threshold
        if available_surplus <= 0:
            continue
        dist = haversine_km(
            deficit_hospital.lat, deficit_hospital.lon,
            h.lat, h.lon
        )
        if dist < 0.1:
            dist = 0.1
        score = available_surplus / dist
        candidates.append((score, dist, h, available_surplus))

    candidates.sort(key=lambda x: x[0], reverse=True)

    recommendations = []
    remaining = required_qty

    for score, dist, source, max_transfer in candidates:
        if remaining <= 0:
            break
        transfer_qty = min(max_transfer, remaining)
        delivery_mins = estimated_delivery_minutes(dist)

        recommendations.append(TransferRecommendation(
            source_hospital_id        = source.hospital_id,
            source_hospital_name      = source.hospital_name,
            destination_hospital_id   = deficit_hospital.hospital_id,
            destination_hospital_name = deficit_hospital.hospital_name,
            resource_name             = resource_name,
            transfer_quantity         = round(transfer_qty, 1),
            distance_km               = round(dist, 2),
            estimated_delivery_minutes= delivery_mins,
            source_stock_after        = round(source.current_stock - transfer_qty, 1),
            destination_stock_after   = round(deficit_hospital.current_stock + transfer_qty, 1),
            optimisation_reason       = (
                f"Highest surplus-to-distance ratio. "
                f"{transfer_qty:.0f} units from {source.hospital_name} "
                f"({dist:.1f} km, ~{delivery_mins} min delivery)."
            ),
        ))
        remaining -= transfer_qty

    total_covered = required_qty - max(remaining, 0)
    feasible = remaining <= 0
    
    if feasible:
        msg = "Transfer plan optimised (Greedy fallback)."
    else:
        msg = (f"Partial coverage only. {remaining:.0f} units still deficit out of {required_qty:.0f} — "
               "recommend emergency district procurement.")

    return OptimisationResult(
        feasible              = feasible,
        recommendations       = recommendations,
        total_deficit_covered = total_covered,
        message               = msg,
    )


# ── OR-Tools LP solver ───────────────────────────────────────────────────────

def _ortools_optimise(
    deficit_hospital: HospitalNode,
    surplus_hospitals: list[HospitalNode],
    resource_name: str,
    required_qty: float,
    correlation_id: str
) -> OptimisationResult:
    solver = pywraplp.Solver.CreateSolver("GLOP")
    if not solver:
        return _greedy_optimise(
            deficit_hospital, surplus_hospitals, resource_name, required_qty, correlation_id
        )

    n = len(surplus_hospitals)
    distances = []
    surpluses = []
    transfer_vars = []

    for i, h in enumerate(surplus_hospitals):
        dist = haversine_km(
            deficit_hospital.lat, deficit_hospital.lon,
            h.lat, h.lon
        )
        distances.append(max(dist, 0.1))
        surplus = max(0.0, h.current_stock - h.min_threshold)
        surpluses.append(surplus)
        var = solver.NumVar(0.0, surplus, f"t_{i}")
        transfer_vars.append(var)

    # Constraint: cover the deficit
    # If total surplus < required, LP is infeasible. We should still provide partial!
    total_surplus_available = sum(surpluses)
    actual_target = min(required_qty, total_surplus_available)
    
    solver.Add(solver.Sum(transfer_vars) >= actual_target)

    # Objective: minimise total distance-weighted transfer
    objective = solver.Minimize(
        solver.Sum(distances[i] * transfer_vars[i] for i in range(n))
    )

    status = solver.Solve()

    if status not in [pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE]:
        logger.warning("optimization_solver_failure", extra={
            "correlation_id": correlation_id,
            "status": status,
            "event_message": "OR-Tools LP infeasible or failed, falling back to greedy heuristic."
        })
        return _greedy_optimise(
            deficit_hospital, surplus_hospitals, resource_name, required_qty, correlation_id
        )

    recommendations = []
    total_covered = 0.0

    for i, h in enumerate(surplus_hospitals):
        qty = transfer_vars[i].solution_value()
        if qty < 1.0:
            continue
        dist = distances[i]
        delivery_mins = estimated_delivery_minutes(dist)
        recommendations.append(TransferRecommendation(
            source_hospital_id        = h.hospital_id,
            source_hospital_name      = h.hospital_name,
            destination_hospital_id   = deficit_hospital.hospital_id,
            destination_hospital_name = deficit_hospital.hospital_name,
            resource_name             = resource_name,
            transfer_quantity         = round(qty, 1),
            distance_km               = round(dist, 2),
            estimated_delivery_minutes= delivery_mins,
            source_stock_after        = round(h.current_stock - qty, 1),
            destination_stock_after   = round(deficit_hospital.current_stock + qty, 1),
            optimisation_reason       = (
                f"OR-Tools LP optimal allocation. "
                f"{qty:.0f} units from {h.hospital_name} "
                f"({dist:.1f} km, ~{delivery_mins} min). "
                f"Minimises total district transport distance."
            ),
        ))
        total_covered += qty

    feasible = total_covered >= required_qty
    if feasible:
        msg = f"OR-Tools LP optimal solution. Objective value: {solver.Objective().Value():.2f}"
    else:
        msg = f"LP Partially Feasible: {total_covered:.1f} units covered out of {required_qty:.1f}. Recommend emergency district procurement."

    return OptimisationResult(
        feasible              = feasible,
        recommendations       = recommendations,
        total_deficit_covered = round(total_covered, 1),
        message               = msg,
    )


# ── Public API ───────────────────────────────────────────────────────────────

def find_optimal_transfer(
    deficit_hospital: HospitalNode,
    all_hospitals: list[HospitalNode],
    resource_name: str,
    required_quantity: float,
    max_distance_km: float = DEFAULT_MAX_DISTANCE_KM,
    correlation_id: str = "UNKNOWN"
) -> OptimisationResult:
    start_time = time.perf_counter()
    
    _validate_optimisation_inputs(deficit_hospital, all_hospitals, required_quantity)

    # Filter to surplus hospitals within range
    surplus_hospitals = []
    for h in all_hospitals:
        if h.hospital_id == deficit_hospital.hospital_id:
            continue
        surplus = h.current_stock - h.min_threshold
        if surplus <= 0:
            continue
        dist = haversine_km(
            deficit_hospital.lat, deficit_hospital.lon,
            h.lat, h.lon
        )
        if dist <= max_distance_km:
            surplus_hospitals.append(h)

    if not surplus_hospitals:
        logger.info("optimization_no_surplus", extra={
            "correlation_id": correlation_id,
            "resource": resource_name,
            "event_message": "No surplus hospitals found within range."
        })
        return OptimisationResult(
            feasible = False,
            message  = (
                f"No surplus hospitals within {max_distance_km} km for {resource_name}. "
                "Recommend emergency district procurement."
            ),
        )

    if ORTOOLS_AVAILABLE:
        result = _ortools_optimise(
            deficit_hospital, surplus_hospitals, resource_name, required_quantity, correlation_id
        )
    else:
        result = _greedy_optimise(
            deficit_hospital, surplus_hospitals, resource_name, required_quantity, correlation_id
        )
        
    exec_time_ms = (time.perf_counter() - start_time) * 1000.0
    
    logger.info("optimization_complete", extra={
        "correlation_id": correlation_id,
        "execution_time_ms": round(exec_time_ms, 2),
        "resource": resource_name,
        "feasible": result.feasible,
        "total_deficit_covered": result.total_deficit_covered,
        "target_quantity": required_quantity,
        "recommendations_count": len(result.recommendations)
    })
    
    return result