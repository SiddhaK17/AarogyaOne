# TECHNICAL SPECIFICATION DOCUMENT

## ArogyaPulse

### AI-Powered Public Healthcare Intelligence & Resource Management Platform

### Internal Technical Documentation

### Team Development Guide

# 1. Introduction

## 1.1 Project Overview

ArogyaPulse is an AI-powered public healthcare intelligence platform designed to improve operational efficiency across Primary Health Centres (PHCs), Community Health Centres (CHCs), District Hospitals, and Government Medical Institutions.

Unlike traditional Hospital Management Systems, which focus primarily on patient records and administrative workflows, ArogyaPulse focuses on operational intelligence. The platform continuously monitors healthcare resources, predicts shortages before they occur, assists government authorities in making data-driven decisions, and provides a unified ecosystem connecting hospitals, district administrators, government departments, and citizens.

The platform directly addresses the Smart Health challenge by introducing predictive analytics, multilingual accessibility, AI-assisted decision making, automated resource redistribution, infrastructure monitoring, and centralized district-level visibility.

The primary objective is not merely to digitize hospital operations, but to transform reactive healthcare management into a proactive, AI-assisted system capable of identifying problems before they impact patient care.

## 1.2 Project Objectives

The platform has been designed around six primary objectives:

Provide real-time operational visibility into every registered government health centre.

Predict shortages of medicines, beds, oxygen, and medical staff before they become critical.

Recommend intelligent redistribution of healthcare resources across nearby hospitals.

Enable multilingual communication for hospital staff and citizens regardless of digital literacy.

Assist district authorities through AI-generated insights, reports, and recommendations.

Create a scalable architecture capable of expanding from a single district to a nationwide healthcare network.

# 2. Overall System Architecture

Instead of treating hospitals as isolated entities, ArogyaPulse views every hospital as part of a connected healthcare ecosystem.

Every operational update made by a hospital immediately contributes to district-wide intelligence.

Citizens

│

│

Report Complaints / Feedback

│

▼

Citizen Portal

│

│

▼

AI Intelligence Engine

▲

│

Hospital Portal ──────────│───────── District Command Centre

│

│

▼

Government Authority Portal

│

▼

Action / Resource Allocation

The AI Intelligence Engine becomes the brain of the entire platform.

Every portal communicates with this centralized intelligence layer rather than implementing AI independently.

This architecture makes the platform modular, maintainable, and production-ready.

# 3. User Roles

The platform will support four primary user roles.

## 3.1 Hospital Users

Users responsible for updating hospital operations.

Examples include:

Medical Officer

Hospital Administrator

Pharmacist

Nurse Supervisor

Inventory Manager

Responsibilities include:

Updating medicine inventory

Managing bed availability

Recording doctor attendance

Raising infrastructure issues

Requesting emergency resources

## 3.2 District Administration

Users responsible for supervising hospitals within a district.

Examples:

District Health Officer

Chief Medical Officer

District Collector

Health Operations Team

Responsibilities:

Monitor all hospitals

View AI alerts

Approve resource transfers

Generate district reports

Track hospital performance

Allocate emergency support

## 3.3 Government Authorities

Different government departments responsible for resolving operational issues.

Examples:

Public Works Department

Biomedical Engineering Department

Medical Supply Department

Electricity Board

Water Department

Emergency Response Team

Responsibilities:

Receive assigned tasks

Update work progress

Upload completion evidence

Close issues

## 3.4 Citizens

Citizens do not manage hospital operations.

Instead, they act as an external validation layer.

Responsibilities:

Report issues

Upload photos

Record voice complaints

Provide hospital feedback

Track complaint status

View nearby hospitals

Citizen feedback contributes to hospital performance scores and enables authorities to identify recurring operational issues that may not be reported internally.

# 4. Technology Stack

The project will use a unified technology stack across all portals to simplify development and maintenance.

## Frontend

Next.js (React Framework)

TypeScript

Tailwind CSS

shadcn/ui

React Query

React Hook Form

Zod Validation

Recharts

Leaflet for maps

The same frontend project will serve all portals.

Role-Based Access Control (RBAC) will determine which pages and features are available after login.

This approach reduces code duplication and simplifies deployment.

## Backend

FastAPI

Python 3.12

SQLAlchemy ORM

WebSockets

JWT Authentication

Celery (background jobs)

Redis

FastAPI has been selected because the entire AI layer will also be written in Python, allowing seamless integration between APIs and machine learning models.

## Database

PostgreSQL

Redis

MinIO (object storage)

PostgreSQL stores structured operational data.

Redis handles caching and real-time notifications.

MinIO stores uploaded images, videos, and voice recordings.

## AI Stack

PyTorch

HuggingFace Transformers

LightGBM

XGBoost

IndicWhisper

IndicTrans2

IndicBERT

YOLOv11

OR-Tools

LangChain (optional, only if we include retrieval-augmented report generation)

The AI stack is intentionally built around open-source technologies so the platform can run locally without depending on paid APIs.

# 5. Platform Overview

The website consists of one public landing page and four secure portals.

Each portal serves a different user role but operates on the same centralized backend and AI engine.

The five primary sections of the platform are:

Public Landing Website

Hospital Portal

District Command Centre

Government Authority Portal

Citizen Portal

Each portal will now be described in detail.

# 6. Public Landing Website

## Purpose

The landing website serves as the public face of ArogyaPulse.

It introduces the platform, explains its purpose, highlights key capabilities, and provides secure access to the different user portals.

Unlike the other sections of the application, the landing website does not perform operational tasks. Instead, it communicates the vision of the platform and acts as the entry point for all stakeholders.

A clean, government-style interface with a professional design will reinforce trust and make the platform appear suitable for real-world deployment.

## Pages

The public website will include:

Home

About ArogyaPulse

Platform Features

How It Works

AI Capabilities

Supported Languages

Contact Information

Login Gateway

The Login Gateway will allow users to choose their role:

Hospital Login

District Administration Login

Government Authority Login

Citizen Login / Complaint Tracking

Each option redirects the user to the appropriate authenticated portal while using the same authentication system.

## Influence on the Platform

Although the landing website does not directly interact with operational data, it establishes the identity of the platform and provides a centralized access point for all users.

Its professional presentation is also important during the hackathon demonstration, as it creates the first impression of the project and immediately communicates that the solution is designed as a unified government platform rather than a collection of disconnected dashboards.

## Technology Used

The landing website will use the same frontend stack as the rest of the application:

Next.js

TypeScript

Tailwind CSS

shadcn/ui

Framer Motion (for subtle animations)

No AI models are directly implemented on this page.

# 7. Hospital Portal

## 7.1 Purpose

The Hospital Portal is the operational interface used by every registered Primary Health Centre (PHC), Community Health Centre (CHC), Government Hospital, and District Hospital participating in the ArogyaPulse network.

Unlike a traditional Hospital Management System, this portal is not intended to manage patients, prescriptions, appointments, or electronic medical records. Instead, it focuses entirely on operational intelligence. The hospital continuously reports its operational status, allowing the AI engine to maintain a real-time understanding of healthcare capacity across an entire district.

Every update made through this portal becomes part of the district intelligence network. The AI uses these updates to forecast shortages, recommend resource redistribution, identify underperforming centres, and generate alerts for district authorities.

In simple terms:

Hospital Portal → AI Engine → District Decisions

Without this portal, the AI has no data to learn from, making it the foundation of the entire platform.

# 7.2 User Roles

Different hospital personnel will access the portal with different permissions.

| Role | Permissions |
| --- | --- |
| Medical Superintendent | Full hospital management |
| Hospital Administrator | Manage hospital profile and operations |
| Pharmacist | Medicine inventory only |
| Nurse Supervisor | Bed availability and nursing staff |
| Medical Officer | Patient statistics and issue reporting |
| Inventory Manager | Stock updates and transfers |

Role-Based Access Control (RBAC) ensures that users only access features relevant to their responsibilities.

# 7.3 Hospital Portal Structure

The Hospital Portal consists of the following pages:

Dashboard

Hospital Profile

Resource & Inventory Management

Bed Management

Staff & Attendance

Patient Statistics

Infrastructure & Issue Reporting

Resource Transfer Centre

Reports & Analytics

Notifications & AI Alerts

AI Voice Assistant

Settings

Each page has a specific responsibility and contributes operational data to the AI engine.

# 7.4 Dashboard

## Purpose

The Dashboard provides hospital staff with a complete overview of the hospital's operational status in one place.

Instead of navigating through multiple sections, administrators should immediately understand:

Current medicine stock

Bed occupancy

Staff attendance

Active alerts

Pending transfers

Infrastructure issues

AI predictions

Daily patient statistics

The dashboard serves as the hospital's command centre.

## Components

The dashboard will contain the following sections:

### Summary Cards

Display high-level metrics such as:

Total Medicines

ICU Beds Available

General Beds Available

Doctors Present Today

Nurses Present

Ambulances Available

Today's OPD

Today's IPD

These cards provide an instant operational snapshot.

### Resource Status Widget

Displays current availability of:

Medicines

Oxygen Cylinders

Blood Units

PPE Kits

Vaccines

Emergency Equipment

Each resource is colour-coded:

🟢 Healthy

🟡 Low

🔴 Critical

This allows staff to immediately identify shortages.

### AI Health Score

One of the unique features of ArogyaPulse.

Every hospital receives an AI-generated operational health score out of 100.

The score is calculated using:

Medicine availability

Bed availability

Staff attendance

Complaint frequency

Issue resolution speed

Equipment uptime

Resource utilization

Historical trends

This score is visible to both the hospital and district administrators.

Its purpose is to encourage proactive management while helping authorities quickly identify facilities requiring intervention.

### AI Forecast Widget

Displays predictions generated by the Forecasting Engine.

Examples:

Paracetamol expected to run out in 3 days.

ICU occupancy expected to reach 92% tomorrow.

Oxygen demand likely to increase next week.

Doctor shortage expected during upcoming festival period.

Rather than reacting to shortages, hospitals can prepare in advance.

### Recent Activity Timeline

Displays all recent operational activities.

Examples:

Inventory updated

Issue reported

Transfer approved

New complaint received

Resource delivered

This improves transparency and accountability.

### AI Recommendations Panel

One of the most important dashboard components.

Instead of simply displaying information, the AI actively recommends actions.

Examples:

Request additional insulin.

Transfer surplus oxygen cylinders to Hospital X.

Increase doctor allocation for the weekend.

Investigate increasing citizen complaints.

The objective is to shift hospital management from reactive decision-making to proactive planning.

## AI Models Used

### Forecasting Engine

Purpose:

Predict future demand for medicines, beds, oxygen, and staff.

Model:

LightGBM Regressor

Reason for selection:

Healthcare operational data is primarily structured and tabular rather than image- or text-based. LightGBM performs exceptionally well on structured datasets, trains quickly, handles missing values effectively, and provides explainable feature importance. It is also much lighter than deep learning models while maintaining excellent predictive accuracy.

Training Data:

Historical medicine consumption

Bed occupancy

OPD/IPD statistics

Seasonal trends

Weather (optional future enhancement)

Synthetic operational data

Training Approach:

Daily records aggregated into time-series features

Feature engineering for rolling averages, weekday patterns, seasonal effects

Evaluation using MAE and RMSE

Retrained periodically as new operational data accumulates

### Hospital Health Score Engine

Purpose:

Calculate an overall operational performance score.

Model:

XGBoost

Reason:

The score depends on multiple structured indicators with nonlinear relationships. XGBoost is interpretable, efficient, and widely used for tabular decision-support systems.

Outputs:

Overall score (0–100)

Risk category

Top contributing factors

Suggested improvements

## Backend APIs

Examples include:

Get dashboard summary

Get inventory overview

Get AI predictions

Get notifications

Get health score

Get recent activity

The dashboard itself does not modify data. It aggregates information from multiple backend services.

## Database Tables

The dashboard reads from:

Hospitals

Medicines

Inventory

Beds

StaffAttendance

PatientStatistics

Alerts

Transfers

Complaints

AIRecommendations

# 7.5 Hospital Profile

## Purpose

This page stores and manages all information related to the healthcare facility itself.

Every registered hospital becomes a verified node within the ArogyaPulse network.

District administrators approve registrations before activation.

## Information Collected

Hospital Name

Registration Number

Hospital Type (PHC / CHC / District Hospital)

District

Taluka

Address

GPS Coordinates

Contact Details

Number of Departments

Total Beds

ICU Capacity

Laboratory Facilities

Ambulance Availability

Operating Hours

## AI Integration

Unlike other pages, this page performs document verification rather than predictive analysis.

Instead of training a custom document model (which is unnecessary for a hackathon), uploaded registration documents are validated through rule-based checks combined with OCR.

The objective is simply to ensure that mandatory information is complete before activation.

## Future Production Enhancement

In a production deployment, document authenticity could be verified using digital signatures or government registries. For the hackathon, approval by the District Administrator is sufficient.

# 7.6 Resource & Inventory Management

## Purpose

This page is the single most important operational module in the Hospital Portal.

It allows hospital staff to maintain real-time records of all critical medical resources. These records become the primary input for the AI Forecasting Engine and the Resource Redistribution Engine.

Every inventory update immediately affects district-wide visibility and future AI predictions.

## Resources Managed

The inventory module tracks:

Medicines

Vaccines

Oxygen Cylinders

Blood Units

PPE Kits

Surgical Consumables

Emergency Equipment

Laboratory Reagents

For each resource, the following information is stored:

Item Name

Category

Current Quantity

Minimum Threshold

Maximum Capacity

Supplier

Batch Number

Expiry Date

Last Updated

Updated By

## AI Features

This page integrates directly with two AI services.

### AI Forecasting

Whenever inventory changes, the forecasting model recalculates expected depletion dates. For Example:

Current Stock: 420 units

Average Daily Usage: 68 units

Predicted Stock-Out: 6.2 days

### Smart Restocking Suggestions

Rather than simply warning that stock is low, the system recommends the quantity that should be requested based on projected demand and historical consumption patterns.

### Smart Redistribution Trigger

When inventory falls below a critical threshold, the Resource Optimization Engine searches nearby hospitals with surplus inventory and proposes transfer recommendations.

This fulfills one of the core objectives of the Smart Health challenge by enabling intelligent redistribution of healthcare resources across the district.

## Voice-Assisted Inventory Entry (Brownie Point)

To improve accessibility, staff can update inventory using voice commands.

Example:

"Add 120 paracetamol tablets."

"Reduce oxygen cylinders by five."

Speech is converted to text using IndicWhisper, parsed into structured commands, validated, and then applied to the inventory database after user confirmation.

This reduces manual typing and supports users with limited digital literacy.

## Technology Stack

Next.js + TypeScript (UI)

FastAPI (Backend)

PostgreSQL (Storage)

Redis (Caching)

WebSockets (Real-time updates)

IndicWhisper (Speech-to-Text)

LightGBM (Forecasting)

OR-Tools (Resource Optimization)

# 7.7 Bed Management

## Purpose

Bed availability is one of the most critical operational indicators in any healthcare facility. During outbreaks, disasters, or seasonal spikes in patient admissions, hospitals often struggle because administrators do not have a real-time understanding of bed occupancy across the district.

The Bed Management module ensures that every hospital continuously updates its bed availability, enabling district administrators and the AI engine to make informed decisions about patient load distribution and emergency preparedness.

This module directly fulfills the Smart Health challenge requirement of providing real-time bed availability and contributes to predictive capacity planning.

## Information Captured

The page will categorize beds into different operational groups rather than maintaining a single total count.

### General Beds

Total Capacity

Currently Occupied

Available

Reserved

### ICU Beds

Total ICU Beds

Occupied ICU Beds

Available ICU Beds

### Emergency Beds

### Isolation Beds

### Pediatric Beds

### Maternity Beds

Each category provides:

Current Status

Last Updated Timestamp

Updated By

Occupancy Percentage

## Dashboard Components

The page should contain:

Bed Occupancy Overview Cards

Bed Utilization Charts

Occupancy Trends

Emergency Capacity Indicator

AI Prediction Panel

Last Update Timeline

## AI Integration

### Bed Occupancy Forecasting

The forecasting model continuously predicts future occupancy based on:

Historical admissions

OPD/IPD trends

Seasonal disease outbreaks

Current occupancy rate

Local trends

Example Output:

Current ICU Occupancy

84%

Predicted Tomorrow

96%

Risk Level

HIGH

Recommendation

Temporarily reserve 6 additional ICU beds.

### District Load Balancing

If a hospital reaches a predefined occupancy threshold (for example, 90%), the Resource Optimization Engine recommends redirecting future patients to nearby hospitals with available capacity.

This makes the system proactive instead of reactive.

## Technology

Frontend:

React

Recharts

Tailwind

Backend:

FastAPI

AI:

LightGBM Forecasting

Database:

Beds Table

BedHistory Table

# 7.8 Staff & Attendance Management

## Purpose

The Smart Health challenge explicitly requires monitoring doctor attendance. However, a production-ready solution should monitor the operational availability of all critical healthcare personnel.

This module maintains the daily workforce availability of the hospital and enables the AI engine to predict staffing shortages before they become operational risks.

## Staff Categories

The module tracks:

Doctors

Nurses

Lab Technicians

Pharmacists

Radiologists

Administrative Staff

Ambulance Drivers

Support Staff

## Information Captured

For each employee:

Employee ID

Department

Designation

Attendance Status

Shift

Check-in Time

Check-out Time

Leave Status

## Dashboard Widgets

Today's Staff Summary

Present

Absent

On Leave

Emergency Staff

Available Specialists

Shift Distribution

Attendance Heatmap

## AI Integration

### Workforce Risk Prediction

The AI predicts whether staffing levels are sufficient for projected patient demand.

Example

Current Doctors

7

Tomorrow Required

10

Prediction

Doctor shortage likely.

Recommendation

Request temporary deployment from Hospital B.

### Department Load Prediction

Instead of predicting only overall shortages, the model identifies departments likely to become understaffed.

Examples

Emergency

Radiology

Laboratory

ICU

This makes the recommendation more actionable.

## Future Scope

Future versions could integrate biometric attendance systems, but for the hackathon manual attendance is sufficient.

# 7.9 Patient Statistics

## Purpose

This module does not store individual patient records.

Instead, it maintains aggregate operational statistics required for forecasting.

The challenge specifically mentions monitoring patient footfall, making this module essential.

## Information Collected

Today's OPD

Today's IPD

Emergency Admissions

Discharges

Referrals

Critical Cases

Ambulance Arrivals

Average Waiting Time

## Dashboard

Daily Patient Count

Weekly Trends

Department Distribution

Average Wait Time

Peak Hours

AI Forecast

## AI Integration

The Forecasting Engine combines patient statistics with inventory and staffing data.

Example

Average Daily OPD

410

Predicted Tomorrow

565

Expected Increase

38%

Recommendation

Increase outpatient staff.

## Why This Matters

Patient statistics become one of the strongest predictors for

Medicine demand

Bed occupancy

Doctor workload

Oxygen consumption

Laboratory workload

# 7.10 Infrastructure & Issue Reporting

## Purpose

Hospitals frequently experience operational problems that are unrelated to medicine inventory.

Examples include

Broken MRI

Power outage

Leaking oxygen pipeline

Damaged ICU

Broken X-Ray

Water leakage

Generator failure

Instead of relying on paper complaints, hospitals should report issues digitally.

## Information Collected

Issue Type

Description

Priority

Location

Affected Department

Photo

Video

Voice Note

Timestamp

Reporter

## AI Integration

This page contains one of the strongest AI features in the entire platform.

### Vision Intelligence

Uploaded images are analyzed using

YOLOv11

combined with

LLaVA

(or another open multimodal vision-language model)

The objective is not to estimate repair cost. Instead, the model identifies:

Visible damage

Equipment category

Severity

Operational impact

### Voice Intelligence

Voice notes are converted into structured text using IndicWhisper.

### Complaint Classification

The textual complaint is processed using IndicBERT.

Outputs:

Category

Severity

Department

Priority

Urgency

Example

Input

MRI machine stopped working and emergency patients are waiting.

Output

Category

Equipment Failure

Priority

Critical

Department

Biomedical Engineering

Urgency

Immediate

### Automatic Routing

The AI automatically routes the issue to the correct Government Authority Portal.

No manual forwarding required.

# 7.11 Resource Transfer Centre

## Purpose

This page implements the most important requirement of the Smart Health challenge.

Rather than waiting for government replenishment, hospitals can temporarily exchange resources across the district.

## Transfer Workflow

Hospital A

↓

Stock Low

↓

AI Detects Shortage

↓

Nearby Hospitals Evaluated

↓

Optimal Hospital Selected

↓

District Approval

↓

Transfer

↓

Inventory Updated

## Information Displayed

Transfer Requests

Incoming Requests

Outgoing Requests

Pending Approval

Transfer History

Delivery Status

ETA

## AI Integration

### Resource Optimization Engine

Model

Google OR-Tools

Reason

This is an optimization problem rather than a prediction problem.

The engine considers:

Distance

Current Stock

Urgency

Travel Time

Available Quantity

Hospital Risk Score

Transfer Priority

Output

Recommended Transfer

Hospital B

Medicine

Insulin

Quantity

250 Units

Distance

4.2 km

Estimated Delivery

48 Minutes

# 7.12 Reports & Analytics

## Purpose

This page transforms raw operational data into meaningful insights.

Hospitals should not need to manually prepare operational reports.

Instead, reports are generated automatically.

## Available Reports

Daily Operations

Medicine Consumption

Bed Utilization

Staff Attendance

Resource Usage

Infrastructure Issues

Citizen Feedback

Hospital Performance

## Executive Brief Generator (Brownie Point)

This is one of the strongest additions to the project.

Users can generate

Hospital Summary

District Summary

Weekly Executive Brief

Monthly Health Report

The report includes

Operational Summary

Critical Risks

Performance Trends

Resource Requirements

Citizen Satisfaction

AI Recommendations

The report can be exported as

PDF

DOCX

CSV (for raw analytics)

Unlike an AI chatbot, this feature produces structured documents that officials can actually use during meetings.

# 7.13 Notifications & AI Alerts

This page consolidates all operational alerts generated by the platform.

Examples include:

Medicine stock predicted to run out in 3 days

ICU occupancy expected to exceed 95%

Doctor shortage forecast

Resource transfer approved

Infrastructure issue assigned

Citizen complaints exceeding threshold

Alerts are prioritized as:

Critical

High

Medium

Informational

Each alert includes a recommended action and links directly to the relevant page for resolution.

# 7.14 AI Voice Assistant

## Purpose

The AI Voice Assistant improves accessibility for hospital staff who may be more comfortable speaking than typing, especially in multilingual environments.

Rather than functioning as a general chatbot, it acts as a task-oriented assistant tightly integrated with hospital operations.

Example voice commands include:

"Update paracetamol stock to 500 units."

"Show ICU bed availability."

"Raise an issue for a leaking oxygen pipeline."

"Generate today's hospital report."

"Check pending transfer requests."

## AI Pipeline

The processing pipeline is designed to be modular:

Speech Recognition: IndicWhisper converts spoken audio into text.

Language Detection: Automatically identifies the input language.

Translation (if needed): IndicTrans2 converts the text into a canonical processing language (English) while preserving context.

Intent Classification: A lightweight intent classifier (e.g., DistilBERT fine-tuned on operational commands) determines the requested action.

Entity Extraction: Extracts relevant values such as medicine names, quantities, dates, or departments.

Backend Action: The appropriate FastAPI endpoint is called.

Response Generation: The result is translated back to the user's language if necessary and displayed or spoken.

This design avoids relying on a paid conversational AI service while remaining accurate and extensible.

# Hospital Portal Summary

By the end of this module, the Hospital Portal is responsible for:

Registering and managing hospitals.

Maintaining real-time operational data.

Tracking inventory, beds, staff, and patient statistics.

Reporting infrastructure issues.

Initiating and receiving resource transfers.

Generating operational reports.

Providing multilingual voice interaction.

Supplying the AI engine with high-quality data.

Every other portal in ArogyaPulse depends on the information collected here, making it the foundation of the entire platform.

# 8. District Health Intelligence Centre (DHIC)

## 8.1 Purpose

The District Health Intelligence Centre is the centralized operational dashboard used by district-level healthcare authorities to supervise every registered government healthcare facility within their jurisdiction.

Unlike the Hospital Portal, which focuses on reporting operational data from a single healthcare facility, the District Health Intelligence Centre aggregates operational information from every connected hospital and transforms it into actionable district-wide intelligence.

The primary responsibility of this portal is not to manually manage hospitals but to enable administrators to identify emerging risks, coordinate healthcare resources, monitor hospital performance, and make informed decisions using AI-generated recommendations.

Every prediction generated by the AI Engine ultimately appears here, allowing district authorities to respond before operational issues escalate into healthcare emergencies.

This portal directly fulfills nearly every major requirement of the Smart Health challenge:

District-wide operational visibility

Early warning systems

Resource redistribution

Monitoring underperforming health centres

AI-powered decision support

Predictive healthcare management

For the hackathon presentation, this portal should become the centerpiece of the live demonstration.

# 8.2 Users

The District Health Intelligence Centre is designed for district-level government healthcare officials.

Typical users include:

District Health Officer (DHO)

Chief Medical Officer (CMO)

District Surveillance Officer

Health Operations Team

Emergency Response Coordinator

District Collector (Read-only Access)

Each district has its own isolated dashboard.

For example:

Mumbai District administrators can only view Mumbai hospitals.

Pune District administrators can only view Pune hospitals.

Nashik administrators only see Nashik hospitals.

This ensures scalability and mirrors how government healthcare systems are organized.

# 8.3 Portal Structure

The District Health Intelligence Centre consists of the following pages:

District Dashboard

Live District Map

Hospital Intelligence

Resource Management

AI Alert Centre

Citizen Feedback Intelligence

Infrastructure Monitoring

Executive Reports

AI Decision Assistant

Settings & Administration

Each page contributes to a specific aspect of district-level healthcare management.

# 8.4 District Dashboard

## Purpose

This page provides a high-level overview of the operational health of the entire district.

Rather than displaying detailed hospital data immediately, it summarizes district-wide performance using key operational indicators.

The objective is to allow a District Health Officer to understand the current condition of every hospital within a few seconds.

## Dashboard Components

### District Summary Cards

The top section displays key operational metrics.

Examples include:

Total Hospitals Connected

Active PHCs

Active CHCs

Total Available Beds

ICU Beds Available

Doctors On Duty

Active Ambulances

Pending Critical Issues

These metrics update in real time as hospitals submit operational updates.

### District Health Score

One unique feature of ArogyaPulse is the District Health Score.

Rather than evaluating individual hospitals, this score reflects the overall operational readiness of the district.

It combines:

Resource Availability

Bed Capacity

Staff Availability

Citizen Satisfaction

Infrastructure Health

AI Risk Predictions

The score helps district authorities quickly determine whether intervention is required.

### Risk Distribution Widget

Hospitals are grouped according to operational risk.

Example:

Low Risk        42 Hospitals

Medium Risk     11 Hospitals

High Risk        4 Hospitals

Critical         2 Hospitals

Clicking any category immediately filters the hospital list.

### Today's Operational Events

Displays:

Resource Transfers

New Infrastructure Issues

Critical Alerts

Emergency Requests

Citizen Complaints

Completed Tasks

This timeline keeps administrators aware of ongoing district activity.

### AI Recommendations Panel

This panel is one of the most important features in the platform.

Rather than only displaying alerts, the AI actively recommends district-level actions.

Examples:

Transfer oxygen cylinders from Hospital B to Hospital A.

Increase staffing at Hospital X.

Inspect Hospital Y due to declining citizen satisfaction.

Approve emergency procurement of insulin.

Redirect non-critical patients to nearby facilities.

Every recommendation includes:

Confidence Score

Reasoning

Supporting Data

Expected Outcome

This ensures AI remains transparent and explainable.

## AI Models Used

### District Risk Aggregation Engine

Purpose:

Aggregate operational data from all hospitals and calculate district-wide risk.

Model:

XGBoost

Outputs:

District Health Score

Risk Classification

Priority Ranking

Hospital Contribution Analysis

### Forecast Aggregator

Purpose:

Merge predictions from every hospital into district-wide forecasts.

Example:

Hospital A predicts insulin shortage.

Hospital B predicts insulin shortage.

Hospital C predicts insulin shortage.

↓

District Dashboard predicts:

"District-wide insulin shortage expected within 5 days."

This provides strategic rather than local intelligence.

# 8.5 Live District Map

## Purpose

This page provides a geographic visualization of healthcare resources across the district.

Instead of reading spreadsheets, administrators can immediately understand where resources are available and where intervention is required.

This page significantly improves situational awareness and will likely become one of the most visually impressive parts of the demo.

## Map Features

Each hospital appears as a marker.

Marker colours indicate operational status:

🟢 Healthy

🟡 Warning

🟠 High Risk

🔴 Critical

Selecting a hospital opens an information panel displaying:

Hospital Name

Available Beds

ICU Capacity

Medicine Availability

Doctor Attendance

AI Health Score

Active Issues

Citizen Satisfaction

Current Transfers

## Additional Layers

The administrator can enable map overlays for:

Medicine shortages

Bed occupancy

Oxygen availability

Infrastructure issues

Citizen complaints

Ambulance locations (future scope)

## Technology

Frontend:

Leaflet

Backend:

GeoJSON API

Database:

Hospital Coordinates

# 8.6 Hospital Intelligence

## Purpose

This page allows administrators to inspect individual hospitals in detail.

Rather than replacing the Hospital Portal, it provides a supervisory view.

The District Officer cannot edit hospital data directly but can monitor performance and approve recommendations.

## Information Displayed

Hospital Profile

Resource Status

Bed Occupancy

Doctor Attendance

Infrastructure Issues

Citizen Complaints

Transfer Requests

AI Forecasts

Historical Performance

## Performance Scorecard

Each hospital receives scores across multiple dimensions:

Operational Efficiency

Medicine Availability

Infrastructure Reliability

Citizen Satisfaction

Attendance Consistency

Emergency Readiness

These scores contribute to the overall AI Health Score.

## AI Insights

The AI identifies:

Declining performance trends

Frequent shortages

Unusual resource consumption

Delayed issue resolution

High complaint frequency

The system explains why the hospital has received a particular score, improving trust in the AI's recommendations.

# 8.7 Resource Management

## Purpose

This page centralizes all resource transfer requests across the district.

Instead of manually coordinating logistics, administrators can review AI-generated transfer recommendations and approve them with a single action.

## Dashboard Components

Pending Transfers

Approved Transfers

Completed Transfers

Emergency Requests

Inventory Distribution

Resource Heatmap

## AI Resource Optimization

When a shortage is detected, the AI evaluates all nearby hospitals and recommends the optimal source for redistribution.

The optimization considers:

Distance

Travel Time

Current Stock

Predicted Demand

Urgency

Existing Commitments

Unlike a simple nearest-neighbor search, this approach balances operational impact across the district.

## Administrator Actions

The District Officer can:

Approve transfer

Reject recommendation

Modify quantity

Select alternative hospital

Escalate procurement if redistribution is insufficient

This keeps the human in control while using AI as decision support.

# 8.8 AI Alert Centre

## Purpose

This page serves as the central repository for all AI-generated alerts within the district.

Rather than scattering notifications across multiple pages, every prediction, warning, and anomaly is consolidated into one prioritized queue.

## Alert Categories

The system groups alerts into categories such as:

Medicine Stock-Out Risk

Bed Capacity Risk

Staff Shortage

Infrastructure Failure

Resource Transfer Required

Rising Citizen Complaints

Unusual Resource Consumption

Each alert includes:

Severity Level

Confidence Score

Generated Time

Affected Hospital

Recommended Action

Supporting Evidence

This design ensures that administrators can quickly identify and act on the most critical operational issues.

## Why This Portal Matters

The District Health Intelligence Centre is where the platform demonstrates its greatest value. Instead of forcing officials to manually analyze dozens of hospitals, it continuously synthesizes operational data into clear, explainable recommendations.

For the hackathon, this portal showcases:

Real-time operational awareness.

AI-assisted decision-making.

Predictive analytics.

Intelligent resource redistribution.

Transparent governance.

It ties together the data collected by hospitals and transforms it into actionable district-level intelligence, making it the strongest demonstration of the Smart Health challenge's core objectives.

# 9. Citizen Portal

## 9.1 Purpose

The Citizen Portal acts as the public interface of ArogyaPulse, enabling patients and visitors to report issues, submit feedback, and access basic healthcare information.

Unlike hospital staff, citizens do not have access to operational dashboards or internal hospital data. Instead, they provide an external perspective on hospital performance. Their reports serve as an additional data source that complements operational metrics collected from hospitals.

This portal is particularly valuable because it introduces transparency into the healthcare system. In many cases, hospitals may unintentionally overlook operational issues or delays. Citizen feedback allows the AI engine to detect recurring problems and highlight discrepancies between reported operational status and the actual patient experience.

For example, if a hospital reports that all doctors are present but multiple citizens submit complaints stating that no doctor was available throughout the day, the system can automatically flag this inconsistency for review by district authorities.

This feature strengthens accountability while directly contributing to the hackathon's objectives of improving healthcare quality and responsiveness.

# 9.2 Pages

The Citizen Portal consists of the following pages:

Home

Report an Issue

Hospital Search

Nearby Healthcare Centres

Track My Complaint

AI Health Assistant

About ArogyaPulse

Unlike the Hospital Portal or District Health Intelligence Centre, the Citizen Portal intentionally remains lightweight and easy to navigate.

# 9.3 Home Page

## Purpose

The Home Page provides quick access to the platform's most commonly used services.

Rather than overwhelming users with information, the interface should prominently display a small set of primary actions.

Recommended quick actions include:

Report Hospital Issue

Find Nearby Hospital

Track Existing Complaint

Emergency Contact Numbers

AI Health Assistant

The page should also display emergency health notices published by district authorities, such as disease outbreaks or temporary service disruptions.

# 9.4 Report an Issue

## Purpose

This is the most important page within the Citizen Portal.

It allows patients to report operational issues experienced during their visit to a healthcare facility.

The objective is not to collect general reviews but to gather structured operational feedback that can be analyzed by the AI engine.

## Information Collected

The reporting form includes:

Hospital Name

Issue Category

Description

Photo Upload

Video Upload (optional)

Voice Recording (optional)

Date of Visit

Contact Information (optional)

Anonymous Reporting Option

## Issue Categories

To simplify analysis, citizens select one or more predefined categories:

Medicine Not Available

Doctor Unavailable

Long Waiting Time

Equipment Not Working

Cleanliness Issues

Staff Behaviour

Infrastructure Damage

Emergency Services

Other

These categories improve consistency while still allowing detailed descriptions.

## AI Integration

### Speech Recognition

If the user submits a voice recording, IndicWhisper converts the speech into text.

### Language Detection & Translation

The system automatically detects the spoken language. If necessary, IndicTrans2 translates the complaint into English for downstream processing while preserving the original text.

### Complaint Classification

The translated complaint is analyzed using IndicBERT, fine-tuned for healthcare complaint classification.

Outputs include:

Category

Severity

Suggested Department

Confidence Score

### Sentiment Analysis

A lightweight sentiment classifier determines whether the complaint reflects:

Positive Experience

Neutral Feedback

Negative Experience

This contributes to the hospital's citizen satisfaction score.

### Priority Assignment

Based on the complaint content and uploaded media, the AI determines whether the issue requires:

Immediate Attention

High Priority

Routine Investigation

The resulting structured record is forwarded to the District Health Intelligence Centre.

# 9.5 Hospital Search

Citizens can search for hospitals by:

Name

District

Taluka

PIN Code

The page displays basic public information such as:

Address

Contact Number

Departments

Emergency Services

Current Bed Availability (optional)

Average Waiting Time (future enhancement)

Only public information is shown to maintain operational security.

# 9.6 Nearby Healthcare Centres

Using the user's location (with permission), the system displays nearby PHCs, CHCs, and government hospitals.

Each result includes:

Distance

Directions

Contact Number

Available Services

Emergency Availability

This feature improves accessibility, particularly during emergencies.

# 9.7 Track My Complaint

Citizens who submit complaints receive a unique reference number.

The tracking page allows them to view:

Complaint Received

Under AI Analysis

Assigned to Department

Investigation in Progress

Resolved

Closed

This transparency increases public trust and demonstrates that reported issues are being addressed.

# 9.8 AI Health Assistant

Unlike a general-purpose chatbot, the AI Health Assistant is a task-focused assistant that helps users navigate the platform and access public healthcare information.

Example queries include:

"Where is the nearest government hospital?"

"How do I report an issue?"

"What emergency services are available nearby?"

"How do I track my complaint?"

It should not provide medical diagnoses or treatment recommendations, keeping the scope aligned with the hackathon and avoiding clinical risks.

# Technology Stack

Frontend:

Next.js

Tailwind CSS

TypeScript

React Hook Form

Backend:

FastAPI

AI:

IndicWhisper

IndicTrans2

IndicBERT

Lightweight Sentiment Classifier

Database:

CitizenComplaints

ComplaintMedia

ComplaintTracking

# 10. Government Authority Portal

## 10.1 Purpose

The Government Authority Portal is designed for departments responsible for resolving operational issues identified by hospitals or citizens.

While the District Health Intelligence Centre supervises the entire district, individual government departments only need access to tasks assigned to them.

This separation simplifies the interface and ensures each department focuses exclusively on its responsibilities.

# 10.2 Users

Examples include:

Public Works Department (PWD)

Biomedical Engineering Team

District Medical Store

Electricity Board

Water Supply Department

Emergency Logistics Team

Each department accesses only the issues relevant to its domain.

# 10.3 Pages

Assigned Tasks

Task Details

Progress Updates

Completed Work

Performance Analytics

# 10.4 Assigned Tasks

This page displays all unresolved issues assigned to the department.

Each task includes:

Hospital Name

Issue Description

AI Priority

Assigned Date

Due Date

Supporting Images

Voice Notes (if available)

Current Status

Tasks can be filtered by:

Priority

District

Hospital

Status

Assignment Date

# 10.5 Task Details

Selecting a task opens a detailed view containing:

Complete issue description

Uploaded evidence

AI-generated classification

Suggested department

Severity level

Affected services

Historical updates

The assigned officer can:

Accept the task

Request clarification

Add progress notes

Upload repair evidence

Mark as completed

# 10.6 Progress Updates

Departments periodically update task status.

Available statuses include:

Accepted

Inspection Scheduled

Work in Progress

Waiting for Parts

Awaiting Verification

Completed

Every status change is timestamped and synchronized with the District Health Intelligence Centre.

# 10.7 Completed Work

Completed tasks remain available for auditing.

The page includes:

Completion Date

Responsible Officer

Uploaded Completion Photos

Verification Status

Hospital Confirmation

This creates a transparent record of issue resolution.

# 10.8 Performance Analytics

Each department receives operational metrics such as:

Average Resolution Time

Tasks Completed

Pending Work

Overdue Tasks

High-Priority Issues Resolved

These analytics encourage accountability and support administrative reporting.

# AI Integration

The Government Authority Portal does not perform predictive AI tasks.

Instead, it consumes outputs generated by other AI services.

For each assigned issue, the portal displays:

AI Severity Classification

Suggested Priority

Recommended Department

Supporting Explanation

This ensures departments understand why a task has been prioritized without relying on opaque decision-making.

# Technology Stack

Frontend:

Next.js

TypeScript

Tailwind CSS

Recharts

Backend:

FastAPI

Database:

GovernmentTasks

IssueAssignments

ProgressLogs

ResolutionEvidence

# 11. End-to-End Workflow

One of the strengths of ArogyaPulse is that every portal participates in a connected operational workflow rather than functioning independently.

A typical scenario unfolds as follows:

A hospital updates its inventory, indicating that insulin stock has fallen below the critical threshold.

The Forecasting Engine predicts that the remaining stock will be exhausted within three days.

The Resource Optimization Engine identifies a nearby hospital with sufficient surplus inventory.

A transfer recommendation is sent to the District Health Intelligence Centre.

The District Health Officer reviews the recommendation and approves the transfer.

Both hospitals receive notifications, and the transfer is recorded.

Inventory levels are automatically updated after completion.

If a citizen later reports that insulin is still unavailable, the Complaint Intelligence Engine analyzes the report and alerts the District Health Officer if the situation persists.

This closed-loop workflow demonstrates how hospitals, district administrators, government departments, citizens, and AI services collaborate within a single ecosystem.

# 12. AI Intelligence Layer

## 12.1 Overview

The Artificial Intelligence layer is the core decision-making component of ArogyaPulse.

Unlike conventional hospital management software that simply stores operational data, ArogyaPulse continuously analyzes incoming information from hospitals, citizens, and government authorities to generate predictions, recommendations, alerts, and operational insights.

Rather than depending on a single Large Language Model, the platform combines several specialized AI services, each designed for a specific operational task.

This modular architecture offers several advantages:

Higher prediction accuracy by using task-specific models.

Faster inference times.

Easier maintenance and future upgrades.

Greater transparency and explainability.

Ability to run locally without mandatory cloud dependencies.

Every AI prediction generated by the platform ultimately supports human decision-making rather than replacing it. Final operational authority always remains with hospital administrators or district health officers.

# 12.2 AI System Architecture

Instead of every portal performing AI processing independently, all AI-related tasks are routed through a centralized Health Intelligence Engine.

The processing pipeline is as follows:

Hospital Portal

Citizen Portal

Government Authority Portal

District Health Intelligence Centre

│

▼

Health Intelligence Engine

│

┌──────────┼─────────────┐

│                          │                                 │

▼                        ▼                                ▼

Prediction               Classification           Optimization

│                           │                                │

▼                         ▼                               ▼

Recommendations Alerts                     Reports

│

▼

Dashboards

This centralized architecture ensures consistency and avoids duplication of AI logic across multiple modules.

# 12.3 AI Service 1 – Demand Forecasting Engine

## Purpose

The Demand Forecasting Engine predicts future demand for critical healthcare resources before shortages occur.

This service directly addresses one of the core objectives of the Smart Health challenge: enabling early intervention instead of reactive crisis management.

Rather than simply displaying current inventory levels, the model estimates future operational demand based on historical patterns and current trends.

## Predictions Generated

The model forecasts:

Medicine consumption

Bed occupancy

Oxygen demand

OPD patient volume

IPD admissions

Doctor requirements

Laboratory workload

## Why This Model?

Many forecasting libraries such as Prophet are designed primarily for simple time-series data.

However, healthcare demand depends on many variables simultaneously, including:

Historical consumption

Seasonal disease outbreaks

Public holidays

Staff availability

Patient footfall

Hospital capacity

A tree-based gradient boosting model is therefore a better choice because it can incorporate many structured features rather than relying solely on timestamps.

## Selected Model

LightGBM Regressor

Reason for Selection:

Exceptional performance on structured tabular datasets.

Handles missing values naturally.

Fast training and inference.

Supports feature importance for explainability.

Easy to retrain as new operational data becomes available.

Widely used in production environments.

## Input Features

Examples include:

Current medicine stock

Daily consumption rate

Average weekly consumption

Current OPD

Current IPD

Bed occupancy

Doctor attendance

Day of week

Month

Disease season indicator (synthetic during hackathon)

District population (optional)

## Output

Example:

Medicine

Paracetamol

Predicted Remaining Days

4.3

Confidence

94%

Recommended Restock

850 Units

Risk Level

High

## Training Data

Since obtaining real hospital operational data is difficult, we will combine:

Public healthcare datasets from data.gov.in

HMIS operational statistics

Synthetic operational data generated using Python scripts

Seasonal outbreak simulations

The synthetic data will mimic realistic PHC behavior while remaining transparent in the documentation.

## Training Pipeline

Data Cleaning

Feature Engineering

Train/Test Split

Model Training

Hyperparameter Tuning

Cross Validation

Model Evaluation

Model Export

## Deployment

The trained model will be serialized using Joblib and loaded by the FastAPI backend during application startup.

Inference requests will be made through an internal Forecast Service API.

# 12.4 AI Service 2 – Complaint Intelligence Engine

## Purpose

Hospitals and citizens submit large volumes of unstructured complaints in multiple Indian languages.

These complaints cannot be analyzed manually in real time.

The Complaint Intelligence Engine converts these reports into structured operational information that district authorities can act upon.

## Responsibilities

The engine performs:

Complaint Classification

Severity Detection

Priority Assignment

Department Routing

Sentiment Analysis

Duplicate Detection (future enhancement)

## Selected Model

IndicBERT

## Why IndicBERT?

After evaluating multiple multilingual language models, IndicBERT is the best fit because:

Specifically trained on Indian languages.

Excellent multilingual understanding.

Lightweight compared to larger LLMs.

Can be fine-tuned locally on consumer GPUs.

Strong support for Hindi, Marathi, Bengali, Tamil, Telugu, Kannada, Gujarati, Punjabi, and more.

## Supported Languages

For the hackathon, we will demonstrate:

English

Hindi

Marathi

The architecture remains extensible to all major Indic languages supported by IndicBERT.

## Output

Example:

Category

Medicine Shortage

Priority

Critical

Department

District Medical Store

Sentiment

Negative

Confidence

97%

## Dataset

A combination of:

Synthetic healthcare complaints

Public grievance datasets (where applicable)

Manually curated examples reflecting hospital operations

Training examples will cover categories such as:

Medicine shortages

Equipment failures

Staff absence

Long waiting times

Infrastructure issues

Cleanliness

Ambulance delays

## Fine-Tuning

The model will be fine-tuned using Hugging Face Transformers.

Loss Function:

Cross Entropy

Optimizer:

AdamW

Evaluation:

Accuracy

Precision

Recall

F1 Score

# 12.5 AI Service 3 – Speech Intelligence Engine

## Purpose

The platform must remain accessible to users with varying levels of literacy and technical proficiency.

Instead of requiring users to type operational updates, complaints, or inventory changes, the Speech Intelligence Engine enables natural voice interaction.

## Selected Model

IndicWhisper

## Why IndicWhisper?

Although OpenAI's Whisper is excellent, IndicWhisper has been optimized for Indian languages and dialects, making it more suitable for multilingual public healthcare environments.

Advantages include:

High recognition accuracy for Indic languages.

Offline inference capability.

Open-source.

Runs locally on an RTX 4070.

## Workflow

Voice Input

↓

Speech-to-Text

↓

Language Detection

↓

Translation (if necessary)

↓

Intent Detection

↓

Backend Action

↓

Response

## Example

Input:

"आज पैरासिटामोल की 120 गोलियाँ जोड़ दो"

↓

Output:

Action

Update Inventory

Medicine

Paracetamol

Quantity

120

Operation

Add

# 12.6 AI Service 4 – Translation Engine

## Purpose

Different stakeholders interact with the platform in different languages.

The Translation Engine ensures all internal processing remains language-independent while preserving the user's preferred language at the interface level.

## Selected Model

IndicTrans2

## Why IndicTrans2?

IndicTrans2 is currently one of the strongest open-source translation models for Indian languages.

Advantages:

High translation quality.

Offline deployment.

No API cost.

Supports a wide range of Indian languages.

## Workflow

Input Language

↓

Translation

↓

Internal Processing

↓

Output Translation

This ensures all AI services operate on a common internal representation while users continue interacting in their native language.

# 12.7 AI Service 5 – Resource Optimization Engine

## Purpose

One of the primary objectives of the Smart Health challenge is not simply identifying shortages, but intelligently redistributing healthcare resources across the district before shortages affect patient care.

The Resource Optimization Engine is responsible for determining the best source hospital whenever another hospital experiences a shortage.

Rather than selecting the nearest hospital, the engine evaluates multiple operational factors and recommends the most efficient redistribution strategy.

This transforms the system from a monitoring platform into an active decision-support system.

## Why This Is Not a Machine Learning Model

Resource redistribution is fundamentally an optimization problem.

The objective is to find the best allocation of limited resources while satisfying operational constraints.

Machine learning cannot reliably solve this because there is no labeled dataset containing the "correct" transfer for every possible situation.

Instead, optimization algorithms are specifically designed for this class of problems.

## Selected Technology

Google OR-Tools

OR-Tools is an open-source optimization library widely used for logistics, scheduling, and supply-chain optimization.

Advantages include:

Production-proven

Deterministic

Explainable

Extremely fast

Completely offline

No API costs

## Inputs

The engine considers:

Hospital requesting resources

Resource requested

Current inventory

Predicted demand

Available surplus

Distance

Travel time

Hospital risk score

Existing pending transfers

Priority level

Transport availability

## Optimization Logic

Example

Hospital A

Needs

300 insulin units

Nearby hospitals

Hospital B

600 units

Distance

4 km

Hospital C

1800 units

Distance

18 km

Hospital D

400 units

Distance

2 km

The engine evaluates:

Which hospital has sufficient surplus?

Will transferring inventory create another shortage?

Which option minimizes travel?

Which option minimizes future district risk?

The recommendation is generated using these constraints rather than a simple nearest-neighbor approach.

## Output

Example

Recommended Transfer

Source Hospital

Hospital B

Destination

Hospital A

Medicine

Insulin

Transfer Quantity

300 Units

Estimated Delivery Time

42 Minutes

Reason

Lowest district-wide operational impact.

## Integration

Whenever a hospital inventory update triggers a shortage prediction, the Forecasting Engine automatically invokes the Resource Optimization Engine.

The generated recommendation is then sent to the District Health Intelligence Centre for approval.

# 12.8 AI Service 6 – Hospital Intelligence Engine

## Purpose

Rather than displaying dozens of disconnected operational metrics, the platform generates a single, explainable operational score for each hospital.

This score helps district administrators quickly identify hospitals requiring intervention.

The objective is not to rank hospitals competitively but to prioritize operational support.

## Metrics Used

The score combines multiple indicators, including:

Medicine availability

Bed occupancy

Doctor attendance

Infrastructure status

Citizen complaints

Issue resolution time

Emergency preparedness

Resource utilization

Inventory accuracy

Historical operational stability

## Scoring Method

Instead of relying solely on machine learning, the system combines:

Weighted scoring

Rule-based thresholds

Forecast outputs

XGBoost predictions

This hybrid approach provides transparency while still benefiting from predictive analytics.

## Output

Hospital Health Score

86 / 100

Status

Healthy

Key Contributors

Medicine Availability

Excellent

Infrastructure

Good

Citizen Satisfaction

Moderate

Attendance

Excellent

Recommendation

Increase laboratory staffing.

## Explainable AI

Every score includes an explanation.

Rather than displaying

Score = 67

the platform explains

Hospital score decreased because:

Medicine availability fell by 18%

Citizen complaints increased

ICU occupancy exceeded 90%

This improves trust in the AI recommendations.

# 12.9 AI Service 7 – Executive Report Generator

## Purpose

This is one of the strongest "brownie point" features in the project.

District officials often spend significant time manually compiling operational summaries for senior administrators.

The Executive Report Generator automates this process by transforming operational data into structured reports tailored to different audiences.

## Why This Feature Matters

The Smart Health challenge emphasizes practical usability for government stakeholders.

Rather than requiring officials to interpret multiple dashboards, the platform provides concise, decision-ready summaries.

This significantly improves administrative efficiency.

## Report Types

The system supports:

Hospital Daily Summary

District Daily Summary

Weekly District Report

Monthly Performance Report

Critical Incident Report

Emergency Resource Report

## Report Contents

Each report includes:

Operational overview

Medicine status

Bed occupancy

Resource shortages

Hospital rankings

Citizen feedback trends

Infrastructure issues

Pending transfers

Resolved issues

Forecasted risks

AI recommendations

## Export Formats

Reports can be exported as:

PDF

DOCX

CSV (analytics)

## Implementation

This feature does not require a large language model.

Instead, reports are generated using structured templates populated with database queries and AI outputs.

This makes the reports:

Consistent

Fast

Explainable

Offline-capable

If time permits, a local summarization model such as Phi-3 Mini or Qwen2.5-Instruct could be used to generate a narrative executive summary, but this should be treated as an enhancement rather than a core dependency.

# 12.10 AI Service 8 – Workflow Intelligence Engine

## Purpose

Operational issues should move automatically through the correct administrative workflow.

Rather than relying on manual routing, the Workflow Intelligence Engine determines where each issue should be sent based on its classification.

## Example Workflow

Citizen reports:

"No doctor available."

↓

Complaint Intelligence Engine

↓

Category

Staff Availability

↓

Priority

High

↓

Assigned Department

District Health Office

↓

Notification Generated

↓

Task Created

↓

Progress Tracked

## Example 2

Hospital reports:

"Generator failure."

↓

Infrastructure Issue

↓

Critical

↓

Assigned Department

Public Works Department

↓

Emergency Response Triggered

## Benefits

The workflow engine ensures:

No manual routing

Consistent processes

Reduced delays

Complete audit trail

Transparent accountability

# 12.11 AI Orchestration Layer

## Purpose

All AI services should operate as a coordinated pipeline rather than independent components.

The AI Orchestration Layer manages the execution order, communication, and dependency handling between services.

## Processing Pipeline

When a hospital updates inventory:

Inventory data is validated.

The Forecasting Engine predicts future demand.

If a shortage is predicted, the Resource Optimization Engine identifies potential transfer sources.

The Hospital Intelligence Engine updates the hospital's operational score.

A recommendation is generated for the District Health Intelligence Centre.

Notifications are sent to relevant users.

Similarly, when a citizen submits a complaint:

Speech is converted to text (if required).

Text is translated into the processing language.

Complaint Intelligence classifies the issue.

The Workflow Engine assigns the correct department.

The Hospital Intelligence Engine updates the hospital's satisfaction metrics.

The issue appears in the District Health Intelligence Centre.

This orchestration layer ensures that AI services remain modular while collaborating seamlessly.

# 12.12 Final AI Stack

After refining the architecture, I recommend the following AI components:

| Component | Technology | Type |
| --- | --- | --- |
| Demand Forecasting | LightGBM | Machine Learning |
| Complaint Classification | IndicBERT (fine-tuned) | NLP |
| Speech Recognition | IndicWhisper | Speech AI |
| Translation | IndicTrans2 | Translation |
| Resource Optimization | Google OR-Tools | Optimization |
| Hospital Intelligence | XGBoost + Weighted Scoring | Hybrid |
| Workflow Routing | Rule-Based Engine | Decision Logic |
| Executive Reports | Template Engine (+ optional Phi-3/Qwen2.5 summary) | Document Generation |

# 13. Backend Architecture

## 13.1 Purpose

The backend serves as the central communication layer connecting all portals, databases, AI services, and external systems.

Every action performed within ArogyaPulse passes through the backend before reaching the database or AI Engine.

Examples include:

Hospital updates inventory.

Citizen submits complaint.

District Officer approves transfer.

AI predicts shortage.

Executive Report generated.

Every one of these operations is processed by FastAPI.

# 13.2 Overall Backend Architecture

The backend follows a modular layered architecture.

Frontend (Next.js)

│

▼

FastAPI Application

│

┌───────────────────────────────┐

│ Authentication Module                                           │

│ Hospital Module                                                    │

│ Citizen Module                                                      │

│ District Module                                                      │

│ Government Module                                             │

│ AI Intelligence Module                                          │

│ Report Module                                                      │

│ Notification Module                                                │

└───────────────────────────────┘

│

▼

PostgreSQL + Redis + MinIO

│

▼

AI Intelligence Engine

Every feature belongs to its own module.

Nothing is mixed together.

# 13.3 Project Folder Structure

The backend should follow this structure:

backend/

│

├── app/

│   ├── api/

│   ├── auth/

│   ├── hospitals/

│   ├── citizens/

│   ├── district/

│   ├── government/

│   ├── inventory/

│   ├── forecasting/

│   ├── ai/

│   ├── reports/

│   ├── notifications/

│   ├── database/

│   ├── websocket/

│   ├── models/

│   ├── schemas/

│   ├── services/

│   ├── utils/

│   └── config/

│

├── trained_models/

│

├── datasets/

│

├── notebooks/

│

├── uploads/

│

└── main.py

This keeps the project organized and allows each teammate to work independently.

# 13.4 Backend Modules

The backend consists of several functional modules.

## Authentication Module

Responsible for:

Login

Registration

JWT Tokens

Password Hashing

Role Management

Session Validation

Supported Roles:

Hospital

District Admin

Government Department

Citizen

## Hospital Module

Responsible for:

Hospital registration

Hospital profile

Inventory

Beds

Attendance

Patient statistics

Transfers

## District Module

Responsible for:

District Dashboard

Hospital monitoring

Risk analysis

Approvals

AI recommendations

## Citizen Module

Responsible for:

Complaints

Voice uploads

Complaint tracking

Feedback

## Government Module

Responsible for:

Assigned tasks

Progress updates

Completion uploads

## AI Module

This module acts as a bridge between FastAPI and the AI services.

Instead of embedding model code inside API endpoints, every prediction passes through the AI module.

Example:

Inventory Updated

↓

Forecast API

↓

AI Module

↓

LightGBM Model

↓

Prediction

↓

Database

↓

Frontend

This separation makes the codebase much cleaner.

# 13.5 Authentication Architecture

Authentication should use:

JWT Access Token

JWT Refresh Token

Password Hashing

RBAC

Instead of multiple login systems, the same authentication service handles every user.

Example workflow:

Hospital Login

↓

Authentication Module

↓

Role = Hospital

↓

Redirect

↓

Hospital Portal

District Admin follows the same process but is redirected to the District Health Intelligence Centre.

# 13.6 REST API Design

The backend exposes REST APIs organized by module.

Examples:

## Hospital APIs

POST /hospital/register

GET /hospital/dashboard

POST /hospital/inventory

PUT /hospital/inventory

GET /hospital/reports

## Citizen APIs

POST /citizen/report

POST /citizen/upload

GET /citizen/track

GET /citizen/hospitals

## District APIs

GET /district/dashboard

GET /district/map

POST /district/approve-transfer

GET /district/alerts

## Government APIs

GET /government/tasks

PUT /government/task/update

POST /government/upload-proof

## AI APIs

POST /forecast

POST /classify

POST /translate

POST /speech

POST /generate-report

Notice how AI APIs are isolated.

# 13.7 Real-Time Communication

One thing that would impress judges is real-time synchronization.

Instead of refreshing pages every few seconds, the backend should push updates instantly.

Technology:

FastAPI WebSockets

Example:

Hospital updates medicine inventory.

↓

Database updates.

↓

WebSocket broadcasts.

↓

District Dashboard updates immediately.

↓

Hospital Health Score refreshes.

↓

Alert appears.

No refresh required.

# 13.8 Notification Service

The Notification Service centralizes every alert generated by the system.

Notifications include:

Medicine shortage

Transfer approved

Complaint assigned

Issue resolved

Hospital score changed

Critical prediction

Each notification contains:

Title

Description

Priority

Recipient

Timestamp

Action Button

Future production:

SMS

Email

WhatsApp

Push Notifications

For the hackathon:

In-app notifications are sufficient.

# 13.9 File Storage

Many parts of the system require uploads:

Citizen Photos

Voice Notes

Hospital Evidence

Infrastructure Images

Completion Photos

Instead of storing files inside PostgreSQL, use object storage.

Recommended:

MinIO

Reason:

S3-compatible

Free

Runs locally

Easy future migration to AWS S3

Database stores only:

File ID

URL

Owner

Timestamp

# 13.10 Background Tasks

Some AI operations should not block the user interface.

Examples:

Forecast generation

Executive report generation

Hospital score recalculation

Translation

Large speech processing

These should run asynchronously.

Recommended:

Celery + Redis

Workflow:

Inventory Updated

↓

Queue Task

↓

Background Worker

↓

Prediction Complete

↓

Notification Sent

This keeps the UI responsive.

# 13.11 Backend Security

Although this is a hackathon project, basic production practices should be followed.

### Input Validation

Every API request validated using Pydantic.

### Authentication

JWT

### Authorization

RBAC

### SQL Injection

Prevented through SQLAlchemy ORM.

### File Upload Validation

Allowed Types:

Images

Audio

Video

PDF

Reject executable files.

### Rate Limiting

Prevent spam complaint submissions.

# 13.12 Logging

Every critical action should be logged.

Examples:

Hospital Updated Inventory

Complaint Submitted

Transfer Approved

Issue Closed

Report Generated

This improves transparency and debugging.

# 13.13 Why FastAPI?

I considered several backend frameworks.

### Django

Pros:

Built-in Admin

Authentication

ORM

Cons:

Too heavy.

Many features unnecessary.

### Express.js

Pros:

Simple

Fast

Cons:

ML integration becomes complicated.

Requires Python separately.

### Spring Boot

Too heavy for hackathon.

### FastAPI

Pros:

Excellent Python support

Easy ML integration

Automatic API docs

Fast

Async support

Simple deployment

Best choice.

# 13.14 Backend Data Flow

This is how the backend processes a typical request.

Hospital User

↓

Frontend

↓

REST API

↓

Authentication

↓

Hospital Module

↓

Database Update

↓

AI Module

↓

Prediction

↓

Recommendation

↓

Notification

↓

WebSocket

↓

District Dashboard Updates

Notice:

The frontend never directly talks to AI.

Everything flows through the backend.

This keeps the system secure and modular.

# 13.15 Backend Summary

The backend is responsible for:

Managing authentication and role-based access.

Processing all user requests.

Coordinating AI services.

Storing operational data.

Handling real-time communication.

Managing notifications and reports.

Providing secure APIs to every portal.

By using a modular FastAPI architecture, ArogyaPulse remains maintainable, scalable, and well-suited for future expansion while still being realistic for a four-person team to implement within the hackathon timeline.
