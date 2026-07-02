"""
AarogyaOne — Production-Grade Synthetic Grievance Dataset Generator
===================================================================
Generates a large-scale, balanced, multilingual dataset of healthcare
operational grievances for fine-tuning the IndicBERT classifier.

Usage
-----
    python generate_dataset.py                        # 75 000 samples (default)
    python generate_dataset.py --num-samples 5000     # custom count
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import random
import sys
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("aarogya.dataset_generator")

# ── Path helpers ────────────────────────────────────────────────────────────
_FILE_DIR = Path(__file__).resolve().parent
_STORE_DIR = _FILE_DIR.parent
_INTELLIGENCE_DIR = _STORE_DIR.parent
_PIPELINES_DIR = _INTELLIGENCE_DIR / "pipelines"

sys.path.insert(0, str(_PIPELINES_DIR))
from config import (
    CATEGORY_LIST,
    CATEGORY_PORTAL_MAP,
    CATEGORY_DEPARTMENT_MAP,
    SEVERITY_RESPONSE_MAP,
    LANGUAGE_LIST,
    GENERATED_DATASET_PATH,
    DatasetGeneratorConfig,
)


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 1 — GEOGRAPHIC KNOWLEDGE BASE
# ════════════════════════════════════════════════════════════════════════════

STATES_AND_DISTRICTS: Dict[str, List[str]] = {
    "Andhra Pradesh": ["Visakhapatnam", "Guntur", "Krishna", "East Godavari", "West Godavari",
                        "Kurnool", "Chittoor", "Anantapur", "Nellore", "Prakasam", "Srikakulam",
                        "Vizianagaram", "Kadapa", "Tirupati", "Palnadu"],
    "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat", "Tezu", "Bomdila",
                           "Along", "Changlang", "Namsai"],
    "Assam": ["Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Tezpur", "Nagaon",
              "Bongaigaon", "Tinsukia", "Barpeta", "Goalpara", "Karimganj", "Dhubri"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia", "Ara",
              "Begusarai", "Katihar", "Munger", "Chapra", "Samastipur", "Hajipur", "Siwan"],
    "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur", "Rajnandgaon",
                      "Ambikapur", "Raigarh", "Mahasamund", "Kanker"],
    "Goa": ["North Goa", "South Goa"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar",
                "Junagadh", "Gandhinagar", "Anand", "Mehsana", "Kutch", "Bharuch",
                "Navsari", "Patan", "Dahod"],
    "Haryana": ["Gurgaon", "Faridabad", "Hisar", "Panipat", "Karnal", "Sonipat",
                "Rohtak", "Ambala", "Yamunanagar", "Bhiwani", "Sirsa", "Jind"],
    "Himachal Pradesh": ["Shimla", "Manali", "Kullu", "Dharamsala", "Solan", "Mandi",
                          "Bilaspur", "Hamirpur", "Una", "Chamba", "Kangra"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh",
                   "Giridih", "Dumka", "Palamu", "Ramgarh"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubli-Dharwad", "Mangaluru", "Belagavi",
                   "Kalaburagi", "Davanagere", "Shimoga", "Tumkur", "Raichur",
                   "Bidar", "Ballari", "Udupi", "Hassan"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam",
               "Palakkad", "Alappuzha", "Kannur", "Malappuram", "Kottayam",
               "Idukki", "Pathanamthitta", "Wayanad", "Kasaragod"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar",
                        "Dewas", "Satna", "Ratlam", "Rewa", "Chhindwara", "Vidisha",
                        "Khargone", "Betul", "Shivpuri"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur",
                     "Kolhapur", "Thane", "Ratnagiri", "Satara", "Amravati", "Jalgaon",
                     "Dhule", "Latur", "Nanded", "Osmanabad", "Sangli", "Chandrapur",
                     "Beed", "Parbhani", "Sindhudurg", "Raigad"],
    "Manipur": ["Imphal East", "Imphal West", "Thoubal", "Bishnupur", "Churachandpur",
                "Ukhrul", "Senapati", "Tamenglong"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar", "Baghmara"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Lawngtlai"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto",
                 "Phek", "Mon"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Berhampur", "Rourkela", "Sambalpur", "Puri",
               "Balasore", "Baripada", "Koraput", "Jeypore", "Angul", "Kendrapara",
               "Jharsuguda", "Sundargarh"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali",
               "Pathankot", "Hoshiarpur", "Moga", "Firozpur", "Gurdaspur", "Sangrur",
               "Kapurthala", "Muktsar"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Bhilwara",
                   "Alwar", "Sikar", "Sri Ganganagar", "Pali", "Bharatpur", "Tonk",
                   "Chittorgarh", "Nagaur", "Barmer"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Soreng", "Pakyong"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
                    "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Thanjavur",
                    "Dindigul", "Tiruvallur", "Kancheepuram", "Cuddalore", "Nagercoil"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam",
                   "Mahbubnagar", "Nalgonda", "Adilabad", "Medak", "Siddipet",
                   "Suryapet", "Kamareddy"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Ambassa",
                "Belonia", "Khowai"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut",
                       "Noida", "Ghaziabad", "Bareilly", "Aligarh", "Moradabad",
                       "Gorakhpur", "Jhansi", "Mathura", "Firozabad", "Muzaffarnagar",
                       "Saharanpur", "Ayodhya", "Azamgarh", "Sultanpur", "Basti"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Rishikesh",
                     "Kashipur", "Rudrapur", "Pithoragarh", "Almora", "Nainital"],
    "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Bardhaman",
                     "Malda", "Kharagpur", "Baharampur", "Cooch Behar", "Haldia",
                     "Krishnanagar", "Bankura", "Jalpaiguri", "Purulia"],
    "Andaman & Nicobar Islands": ["Port Blair", "Car Nicobar", "Mayabunder"],
    "Chandigarh": ["Chandigarh"],
    "Dadra & Nagar Haveli and Daman & Diu": ["Silvassa", "Daman", "Diu"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi",
              "Central Delhi", "North East Delhi", "South West Delhi", "North West Delhi",
              "South East Delhi", "Shahdara"],
    "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kupwara",
                         "Pulwama", "Rajouri", "Udhampur", "Kathua", "Doda",
                         "Sopore", "Poonch"],
    "Ladakh": ["Leh", "Kargil"],
    "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
}

HOSPITAL_TYPES: List[str] = [
    "Primary Health Centre", "Community Health Centre", "Sub-District Hospital",
    "District Hospital", "Government Medical College Hospital",
    "Taluka Hospital", "Rural Hospital", "Urban Health Centre",
    "Referral Hospital", "Women and Children Hospital",
    "ESI Hospital", "Railway Hospital", "Military Hospital",
    "AYUSH Hospital", "TB Sanatorium", "Leprosy Hospital",
    "Mental Health Centre", "Cancer Centre", "Trauma Centre",
    "Civil Hospital", "General Hospital",
]


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 2 — MEDICAL & OPERATIONAL KNOWLEDGE BASE
# ════════════════════════════════════════════════════════════════════════════

MEDICINES: List[str] = [
    "Paracetamol", "Ibuprofen", "Diclofenac", "Aspirin", "Amoxicillin",
    "Azithromycin", "Ciprofloxacin", "Metronidazole", "Doxycycline", "Ceftriaxone",
    "Cefixime", "Levofloxacin", "Cotrimoxazole", "Rifampicin", "Isoniazid",
    "Pyrazinamide", "Ethambutol", "Insulin", "Metformin", "Glimepiride",
    "Glibenclamide", "Amlodipine", "Enalapril", "Losartan", "Atenolol",
    "Furosemide", "Hydrochlorothiazide", "Atorvastatin", "Rosuvastatin",
    "Clopidogrel", "Warfarin", "Heparin", "Digoxin", "Omeprazole",
    "Pantoprazole", "Ranitidine", "Ondansetron", "Metoclopramide", "Domperidone",
    "Salbutamol", "Budesonide", "Montelukast", "Prednisolone", "Dexamethasone",
    "Hydrocortisone", "Methylprednisolone", "Iron Folic Acid tablets",
    "Folic Acid", "Vitamin B12", "Vitamin D", "Calcium tablets", "Zinc tablets",
    "ORS packets", "IV fluids", "Normal Saline", "Ringer Lactate", "Dextrose",
    "Chloroquine", "Artemether-Lumefantrine", "Albendazole", "Ivermectin",
    "Acyclovir", "Fluconazole", "Clotrimazole", "Povidone Iodine",
    "Silver Sulfadiazine", "Diazepam", "Phenytoin", "Carbamazepine",
    "Sodium Valproate", "Lithium", "Haloperidol", "Chlorpromazine",
    "Olanzapine", "Risperidone", "Morphine", "Tramadol", "Pentazocine",
    "Lignocaine", "Bupivacaine", "Ketamine", "Propofol", "Atropine",
    "Adrenaline", "Dopamine", "Dobutamine", "Noradrenaline", "Oxytocin",
    "Misoprostol", "Magnesium Sulphate", "Nifedipine", "Methylergometrine",
    "Tetanus Toxoid", "Anti-Rabies Vaccine", "Anti-Snake Venom",
    "Hepatitis B Vaccine", "BCG Vaccine", "Polio Vaccine",
    "Measles Vaccine", "Pentavalent Vaccine", "Rabeprazole", "Sucralfate",
    "Tranexamic Acid", "Aminophylline", "Deriphylline", "Phenobarbitone",
    "Chlorpheniramine", "Cetirizine", "Levocetirizine", "Betahistine",
]

MEDICAL_EQUIPMENT: List[str] = [
    "Ventilator", "ECG machine", "X-ray machine", "Ultrasound machine",
    "CT scanner", "MRI machine", "Defibrillator", "Pulse oximeter",
    "Blood pressure monitor", "Stethoscope", "Otoscope", "Ophthalmoscope",
    "Digital thermometer", "Glucometer", "Nebulizer", "Oxygen concentrator",
    "Oxygen cylinder", "Suction machine", "Autoclave", "Surgical instruments",
    "Laryngoscope", "Endoscope", "Colposcope", "Laparoscope", "Microscope",
    "Centrifuge", "Haematology analyzer", "Biochemistry analyzer",
    "Urine analyzer", "Dialysis machine", "Infusion pump", "Syringe pump",
    "Cardiac monitor", "Fetal monitor", "Baby incubator", "Phototherapy unit",
    "Radiant warmer", "Wheelchair", "Stretcher trolley", "Hospital bed",
    "ICU bed", "Fowler bed", "Operation table", "OT light",
    "Electrocautery machine", "Anaesthesia workstation", "C-arm machine",
    "Dental chair", "Dental X-ray", "Audiometer", "Spirometer",
    "Treadmill TMT", "Crash cart", "Emergency tray", "Dressing trolley",
    "Instrument trolley", "Mayo table", "IV stand", "Suture kit",
    "Catheter set", "Endotracheal tube set", "Tracheostomy kit",
    "Chest drainage set", "Splints", "Cervical collar", "Foley catheter",
    "Ryle tube", "Ambu bag", "N95 mask", "PPE kit", "Surgical gloves",
    "Surgical gown", "Boyle apparatus", "Doppler machine", "CPAP machine",
    "BiPAP machine", "Blood warmer", "Bone drill", "Plaster saw",
    "Dermatoscope", "Slit lamp", "Fundoscope", "Tonometer",
]

DISEASES: List[str] = [
    "Malaria", "Dengue", "Typhoid", "Cholera", "Tuberculosis", "Pneumonia",
    "COVID-19", "Influenza", "Hepatitis A", "Hepatitis B", "Hepatitis C",
    "HIV/AIDS", "Chikungunya", "Japanese Encephalitis", "Leptospirosis",
    "Kala-azar", "Filariasis", "Leprosy", "Diarrhea", "Dysentery",
    "Gastroenteritis", "Jaundice", "Anaemia", "Diabetes", "Hypertension",
    "Coronary Artery Disease", "Heart Failure", "Stroke", "Chronic Kidney Disease",
    "Liver Cirrhosis", "Asthma", "COPD", "Lung Cancer", "Breast Cancer",
    "Cervical Cancer", "Oral Cancer", "Epilepsy", "Depression",
    "Schizophrenia", "Bipolar Disorder", "Rabies", "Snakebite",
    "Scorpion Sting", "Tetanus", "Measles", "Mumps", "Chickenpox",
    "Diphtheria", "Whooping Cough", "Meningitis", "Sepsis", "UTI",
    "Appendicitis", "Hernia", "Fracture", "Burns", "Road Accident Injury",
    "Poisoning", "Cataract", "Glaucoma", "Conjunctivitis", "Fungal Infection",
    "Scabies", "Dental Caries", "Tonsillitis", "Sinusitis", "Bronchitis",
    "Rheumatoid Arthritis", "Osteoporosis", "Thyroid Disorder",
    "Malnutrition", "Vitamin Deficiency", "Pre-eclampsia", "Eclampsia",
    "Postpartum Haemorrhage", "Neonatal Jaundice", "Birth Asphyxia",
    "Acute Gastritis", "Peptic Ulcer", "Gallstones", "Pancreatitis",
]

GOVERNMENT_SCHEMES: List[str] = [
    "Ayushman Bharat PMJAY", "Janani Suraksha Yojana", "Janani Shishu Suraksha Karyakram",
    "Rashtriya Swasthya Bima Yojana", "National Health Mission",
    "Pradhan Mantri Surakshit Matritva Abhiyan", "Mission Indradhanush",
    "Rashtriya Bal Swasthya Karyakram", "Ayushman Bharat Health Wellness Centre",
    "PM-ABHIM", "National AYUSH Mission", "Rashtriya Kishor Swasthya Karyakram",
    "NP-NCD", "National Mental Health Programme", "National Programme for Control of Blindness",
    "RNTCP", "National Vector Borne Disease Control Programme",
    "National Leprosy Eradication Programme", "IDSP",
    "National AIDS Control Programme", "Universal Immunization Programme",
    "RMNCH+A", "National Iron Plus Initiative", "MAA Programme",
    "LaQshya", "SUMAN", "Pradhan Mantri Matru Vandana Yojana",
    "e-Sanjeevani Telemedicine", "Nikshay Poshan Yojana",
    "Pradhan Mantri Dialysis Programme", "Deendayal Antyodaya Yojana",
    "Mahatma Jyotiba Phule Jan Arogya Yojana", "Atal Amrit Abhiyan",
    "Chief Minister Comprehensive Health Insurance Scheme",
    "Mukhyamantri Amrutum Yojana", "Biju Swasthya Kalyan Yojana",
    "Karunya Health Scheme", "Aarogyasri Scheme",
]

INFRASTRUCTURE_PROBLEMS: List[str] = [
    "leaking roof", "cracked walls", "broken floor tiles", "collapsed ceiling plaster",
    "damaged staircase railing", "broken doors", "shattered windows",
    "blocked drainage", "waterlogged corridors", "peeling paint",
    "broken toilets", "damaged water tank", "potholed road to hospital",
    "broken compound wall", "missing boundary wall", "termite damage",
    "seepage in walls", "dampness", "broken taps", "overflowing septic tank",
    "exposed electrical wiring", "missing manhole covers", "broken signboards",
    "crumbling foundation", "rusty iron beams", "non-functional lift",
]

STAFF_DESIGNATIONS: List[str] = [
    "Medical Officer", "Senior Resident", "Junior Resident", "Specialist Doctor",
    "Surgeon", "Gynaecologist", "Paediatrician", "Anaesthetist", "Radiologist",
    "Pathologist", "Pharmacist", "Staff Nurse", "ANM", "ASHA Worker",
    "Lab Technician", "X-ray Technician", "OT Technician", "Ward Boy",
    "Sweeper", "Security Guard", "Ambulance Driver", "Data Entry Operator",
    "Hospital Administrator", "Medical Superintendent", "Accounts Officer",
    "Store Keeper", "Dietician", "Physiotherapist", "Counsellor",
    "Dental Surgeon", "Ophthalmologist", "ENT Specialist", "Dermatologist",
    "Psychiatrist", "Orthopaedic Surgeon", "Cardiologist",
]

HOSPITAL_AREAS: List[str] = [
    "OPD", "IPD", "Emergency Ward", "ICU", "NICU", "PICU",
    "Operation Theatre", "Labour Room", "Post-operative Ward",
    "General Ward", "Male Ward", "Female Ward", "Paediatric Ward",
    "Maternity Ward", "Surgical Ward", "Medical Ward", "Orthopaedic Ward",
    "Eye Ward", "ENT Ward", "Skin OPD", "Dental OPD", "Casualty",
    "Pharmacy Counter", "Registration Desk", "Billing Counter",
    "X-ray Room", "Ultrasound Room", "CT Scan Room", "Laboratory",
    "Blood Bank", "Store Room", "Canteen", "Waiting Area", "Main Corridor",
    "Toilet Block", "Staff Room", "Doctor Chamber", "Duty Room",
    "Record Room", "Ambulance Bay", "Mortuary", "Dressing Room",
    "Injection Room", "Vaccination Room", "Dialysis Unit",
]

BEHAVIOUR_ISSUES: List[str] = [
    "rude behaviour", "abusive language", "demanding bribes",
    "neglecting patients", "habitual late arrival", "leaving before shift ends",
    "using mobile phone during duty", "sleeping during duty",
    "not wearing uniform or ID", "not following clinical protocols",
    "discriminating against poor patients", "refusing treatment",
    "misguiding patients", "overcharging for services",
    "referring to private clinics for commission", "not explaining treatment",
    "ignoring patient complaints", "being impatient with elderly",
    "unprofessional conduct", "not maintaining hygiene",
]

WEATHER_EVENTS: List[str] = [
    "heavy monsoon rain", "severe flooding", "heat wave", "cold wave",
    "cyclone damage", "earthquake", "thunderstorm", "waterlogging",
    "landslide", "drought", "hailstorm", "dust storm", "fog",
]

PATIENT_GROUPS: List[str] = [
    "pregnant women", "newborns", "children", "elderly patients",
    "disabled patients", "tribal patients", "BPL families",
    "accident victims", "emergency cases", "cancer patients",
    "TB patients", "HIV patients", "mental health patients",
    "burn victims", "surgical patients", "ICU patients",
    "dialysis patients", "maternity patients",
]

URGENCY_WORDING = [
    "URGENT:", "Please help:", "Emergency:", "Very urgent -", "Need immediate action.",
    "Act fast.", "Critical issue!", "Life threatening situation.", "Fix this soon.",
    "Can someone please help?", "Require immediate attention.", "Do something quickly."
]


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 3 — MULTILINGUAL SENTENCE STRUCTURES
# ════════════════════════════════════════════════════════════════════════════

SENTENCE_PATTERNS: Dict[str, List[str]] = {
    "English": [
        # Formal
        "There is a serious problem of {phrase} in the {area}",
        "{phrase} in the {area} since {time}, no action has been taken",
        "I want to complain about {phrase} in the {area}",
        "Patients are suffering because of {phrase} at the {area}",
        "The situation of {phrase} in {area} is very bad",
        "{phrase} has been reported in {area} for {time} but nothing has changed",
        "Please look into the issue of {phrase} in {area} immediately",
        "Nobody is addressing {phrase} in the {area} despite repeated complaints",
        "We are facing {phrase} in {area} and it is getting worse every day",
        "Urgent attention needed for {phrase} in {area} of this hospital",
        
        # Informal / Short / SMS-style
        "No {phrase} since {time}",
        "Need help with {phrase} urgently",
        "{phrase} is a big issue",
        "Please fix {phrase}",
        "Very bad {phrase}",
        "{phrase} at {area} - please help",
        "Suffering from {phrase} in {area}",
        "{phrase} - fix it",
        "Why no action on {phrase}?",
        "Terrible {phrase} in {area}",
    ],
    "Hindi": [
        "{area} में {phrase} की गंभीर समस्या है",
        "{time} से {area} में {phrase} है, कोई कार्रवाई नहीं हुई",
        "मैं {area} में {phrase} की शिकायत करना चाहता हूँ",
        "{area} में {phrase} के कारण मरीज़ परेशान हैं",
        "{area} में {phrase} की स्थिति बहुत खराब है",
        "{time} से {area} में {phrase} की शिकायत है पर कुछ नहीं हुआ",
        "कृपया {area} में {phrase} का तुरंत समाधान करें",
        "{area} में {phrase} की किसी को चिंता नहीं, मरीज़ बेबस हैं",
        "हम {area} में {phrase} से जूझ रहे हैं और हालात बिगड़ रहे हैं",
        "{area} में {phrase} की तत्काल जाँच ज़रूरी है",
        "{time} से {phrase} नहीं है",
        "{phrase} ठीक करो",
        "{area} में {phrase} बहुत खराब है",
        "तुरंत {phrase} पर ध्यान दें",
        "कोई {phrase} नहीं सुन रहा",
    ],
    "Marathi": [
        "{area} मध्ये {phrase} ची गंभीर समस्या आहे",
        "{time} पासून {area} मध्ये {phrase} आहे, कोणतीही कार्यवाही नाही",
        "मला {area} मधील {phrase} बद्दल तक्रार नोंदवायची आहे",
        "{area} मध्ये {phrase} मुळे रुग्णांना त्रास होत आहे",
        "{area} मध्ये {phrase} ची परिस्थिती अत्यंत वाईट आहे",
        "{time} पासून {area} मधील {phrase} बद्दल तक्रार आहे पण काहीच झाले नाही",
        "कृपया {area} मधील {phrase} चे तात्काळ निराकरण करा",
        "{area} मध्ये {phrase} कोणालाही पर्वा नाही, रुग्ण हतबल आहेत",
        "{phrase} लवकर ठीक करा",
        "{time} पासून {phrase} चा त्रास आहे",
        "{area} मध्ये {phrase} खूप खराब आहे",
    ],
    "Tamil": [
        "{area} இல் {phrase} என்ற தீவிர பிரச்சனை உள்ளது",
        "{time} ஆக {area} இல் {phrase}, எந்த நடவடிக்கையும் எடுக்கப்படவில்லை",
        "{area} இல் {phrase} பற்றி புகார் அளிக்க விரும்புகிறேன்",
        "{area} இல் {phrase} காரணமாக நோயாளிகள் அவதிப்படுகின்றனர்",
        "{area} இல் {phrase} நிலைமை மிகவும் மோசமாக உள்ளது",
        "தயவுசெய்து {area} இல் {phrase} உடனடியாக கவனிக்கவும்",
        "{area} இல் {phrase} யாருக்கும் அக்கறை இல்லை, நோயாளிகள் கஷ்டப்படுகிறார்கள்",
        "{time} ஆக {area} இல் {phrase} குறித்து புகார் கொடுத்தும் நடவடிக்கை இல்லை",
        "{phrase} சரியில்லை",
        "{time} முதல் {phrase} பிரச்சனை",
    ],
    "Telugu": [
        "{area} లో {phrase} తీవ్ర సమస్య ఉంది",
        "{time} నుండి {area} లో {phrase}, ఎటువంటి చర్య తీసుకోలేదు",
        "{area} లో {phrase} గురించి ఫిర్యాదు చేయాలనుకుంటున్నాను",
        "{area} లో {phrase} వల్ల రోగులు ఇబ్బంది పడుతున్నారు",
        "{area} లో {phrase} పరిస్థితి చాలా అధ్వాన్నంగా ఉంది",
        "దయచేసి {area} లో {phrase} వెంటనే పరిష్కరించండి",
        "{area} లో {phrase} ఎవరికీ పట్టదు, రోగులు నిస్సహాయంగా ఉన్నారు",
        "{time} నుండి {area} లో {phrase} ఫిర్యాదు ఉన్నా ఏమీ జరగలేదు",
        "{phrase} త్వరగా పరిష్కరించండి",
        "{time} నుండి {phrase} సమస్య ఉంది",
    ],
    "Bengali": [
        "{area} তে {phrase} এর গুরুতর সমস্যা আছে",
        "{time} ধরে {area} তে {phrase}, কোনো ব্যবস্থা নেওয়া হয়নি",
        "{area} তে {phrase} নিয়ে অভিযোগ জানাতে চাই",
        "{area} তে {phrase} এর জন্য রোগীরা কষ্ট পাচ্ছেন",
        "{area} তে {phrase} এর অবস্থা খুবই খারাপ",
        "দয়া করে {area} তে {phrase} এর দ্রুত সমাধান করুন",
        "{area} তে {phrase} নিয়ে কারও মাথাব্যথা নেই, রোগীরা অসহায়",
        "{time} ধরে {area} তে {phrase} এর অভিযোগ করেও কিছু হয়নি",
        "{phrase} ঠিক করুন",
        "{time} থেকে {phrase} এর সমস্যা",
    ],
    "Gujarati": [
        "{area} માં {phrase} ની ગંભીર સમસ્યા છે",
        "{time} થી {area} માં {phrase}, કોઈ કાર્યવાહી નથી",
        "મારે {area} માં {phrase} અંગે ફરિયાદ કરવી છે",
        "{area} માં {phrase} ને કારણે દર્દીઓ પરેશાન છે",
        "{area} માં {phrase} ની પરિસ્થિતિ ખૂબ ખરાબ છે",
        "કૃપા કરીને {area} માં {phrase} નો તાત્કાલિક ઉકેલ કરો",
        "{area} માં {phrase} ની કોઈને ચિંતા નથી, દર્દીઓ લાચાર છે",
        "{time} થી {area} માં {phrase} ની ફરિયાદ છે છતાં કંઈ થયું નથી",
        "{phrase} જલ્દી ઠીક કરો",
    ],
    "Kannada": [
        "{area} ನಲ್ಲಿ {phrase} ಗಂಭೀರ ಸಮಸ್ಯೆ ಇದೆ",
        "{time} ಇಂದ {area} ನಲ್ಲಿ {phrase}, ಯಾವುದೇ ಕ್ರಮ ತೆಗೆದುಕೊಂಡಿಲ್ಲ",
        "{area} ನಲ್ಲಿ {phrase} ಬಗ್ಗೆ ದೂರು ನೀಡಲು ಬಯಸುತ್ತೇನೆ",
        "{area} ನಲ್ಲಿ {phrase} ಕಾರಣ ರೋಗಿಗಳು ತೊಂದರೆ ಅನುಭವಿಸುತ್ತಿದ್ದಾರೆ",
        "{area} ನಲ್ಲಿ {phrase} ಪರಿಸ್ಥಿತಿ ತುಂಬಾ ಕೆಟ್ಟದಾಗಿದೆ",
        "ದಯವಿಟ್ಟು {area} ನಲ್ಲಿ {phrase} ತಕ್ಷಣ ಪರಿಹರಿಸಿ",
        "{area} ನಲ್ಲಿ {phrase} ಯಾರಿಗೂ ಕಾಳಜಿ ಇಲ್ಲ, ರೋಗಿಗಳು ಅಸಹಾಯಕರು",
        "{time} ಇಂದ {area} ನಲ್ಲಿ {phrase} ದೂರು ಕೊಟ್ಟರೂ ಏನೂ ಆಗಿಲ್ಲ",
        "{phrase} ಸರಿಪಡಿಸಿ",
    ],
    "Malayalam": [
        "{area} ൽ {phrase} ഗുരുതരമായ പ്രശ്നം ഉണ്ട്",
        "{time} ആയി {area} ൽ {phrase}, ഒരു നടപടിയും ഇല്ല",
        "{area} ലെ {phrase} നെ കുറിച്ച് പരാതി നൽകാൻ ആഗ്രഹിക്കുന്നു",
        "{area} ൽ {phrase} കാരണം രോഗികൾ ബുദ്ധിമുട്ടുന്നു",
        "{area} ൽ {phrase} ന്റെ അവസ്ഥ വളരെ മോശമാണ്",
        "ദയവായി {area} ൽ {phrase} ഉടൻ പരിഹരിക്കുക",
        "{area} ൽ {phrase} ആർക്കും ശ്രദ്ധയില്ല, രോഗികൾ നിസ്സഹായരാണ്",
        "{time} ആയി {area} ൽ {phrase} പരാതിപ്പെട്ടിട്ടും ഒന്നും ചെയ്തിട്ടില്ല",
        "{phrase} പരിഹരിക്കുക",
    ],
    "Punjabi": [
        "{area} ਵਿੱਚ {phrase} ਦੀ ਗੰਭੀਰ ਸਮੱਸਿਆ ਹੈ",
        "{time} ਤੋਂ {area} ਵਿੱਚ {phrase}, ਕੋਈ ਕਾਰਵਾਈ ਨਹੀਂ ਹੋਈ",
        "ਮੈਂ {area} ਵਿੱਚ {phrase} ਬਾਰੇ ਸ਼ਿਕਾਇਤ ਦਰਜ਼ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ",
        "{area} ਵਿੱਚ {phrase} ਕਾਰਨ ਮਰੀਜ਼ ਪਰੇਸ਼ਾਨ ਹਨ",
        "{area} ਵਿੱਚ {phrase} ਦੀ ਹਾਲਤ ਬਹੁਤ ਮਾੜੀ ਹੈ",
        "ਕਿਰਪਾ ਕਰਕੇ {area} ਵਿੱਚ {phrase} ਤੁਰੰਤ ਹੱਲ ਕਰੋ",
        "{area} ਵਿੱਚ {phrase} ਕਿਸੇ ਨੂੰ ਫ਼ਿਕਰ ਨਹੀਂ, ਮਰੀਜ਼ ਬੇਵੱਸ ਹਨ",
        "{time} ਤੋਂ {area} ਵਿੱਚ {phrase} ਦੀ ਸ਼ਿਕਾਇਤ ਹੈ ਪਰ ਕੁਝ ਨਹੀਂ ਹੋਇਆ",
        "{phrase} ਜਲਦੀ ਠੀਕ ਕਰੋ",
    ],
    "Odia": [
        "{area} ରେ {phrase} ର ଗମ୍ଭୀର ସମସ୍ୟା ଅଛି",
        "{time} ଠାରୁ {area} ରେ {phrase}, କିଛି କାର୍ଯ୍ୟାନୁଷ୍ଠାନ ନାହିଁ",
        "{area} ରେ {phrase} ଯୋଗୁଁ ରୋଗୀମାନେ କଷ୍ଟ ପାଉଛନ୍ତି",
        "{area} ରେ {phrase} ର ପରିସ୍ଥିତି ବହୁତ ଖରାପ",
        "ଦୟାକରି {area} ରେ {phrase} ତୁରନ୍ତ ସମାଧାନ କରନ୍ତୁ",
        "{area} ରେ {phrase} କାହାକୁ ଚିନ୍ତା ନାହିଁ, ରୋଗୀ ଅସହାୟ",
    ],
    "Assamese": [
        "{area} ত {phrase} ৰ গুৰুতৰ সমস্যা আছে",
        "{time} ধৰি {area} ত {phrase}, কোনো ব্যৱস্থা লোৱা হোৱা নাই",
        "{area} ত {phrase} ৰ বাবে ৰোগীসকল কষ্ট পাইছে",
        "{area} ত {phrase} ৰ অৱস্থা বহুত বেয়া",
        "অনুগ্ৰহ কৰি {area} ত {phrase} ততালিকে সমাধান কৰক",
        "{area} ত {phrase} ৰ চিন্তা কাৰো নাই, ৰোগী অসহায়",
    ],
    "Urdu": [
        "{area} میں {phrase} کا سنگین مسئلہ ہے",
        "{time} سے {area} میں {phrase}، کوئی کاروائی نہیں ہوئی",
        "{area} میں {phrase} کی وجہ سے مریض پریشان ہیں",
        "{area} میں {phrase} کی صورتحال بہت خراب ہے",
        "براہ کرم {area} میں {phrase} کا فوری حل کریں",
        "{area} میں {phrase} کسی کو فکر نہیں، مریض بے بس ہیں",
    ],
    "Konkani": [
        "{area} ंत {phrase} ची गंबीर समस्या आसा",
        "{time} सावन {area} ंत {phrase}, कसलीच कार्यवाही जाली ना",
        "{area} ंत {phrase} खातीर दुयेंती त्रासांत आसात",
        "उपकार करून {area} ंत {phrase} ताकतिकेन सोडयात",
        "{area} ंत {phrase} कोणाकूच पडून वचूंक ना",
    ],
    "Sindhi": [
        "{area} ۾ {phrase} جو ڳاڙهو مسئلو آهي",
        "{time} کان {area} ۾ {phrase}، ڪا به عمل ناهي ٿيو",
        "{area} ۾ {phrase} سبب مريض پريشان آهن",
        "مهرباني ڪري {area} ۾ {phrase} فوري طور تي حل ڪريو",
    ],
    "Manipuri": [
        "{area} দা {phrase} গী অচেৎপা থোকপা সমস্যা লৈরে",
        "{time} দগী {area} দা {phrase}, করম্বা লৈত্রে",
        "{area} দা {phrase} না মরীজশিং অৱাবা ফংলিবা",
        "চানবিদুনা {area} দা {phrase} হকশেল থিংগৎপীরক্কদবনি",
    ],
    "Bodo": [
        "{area} आव {phrase} नि जोबोद समस्या दं",
        "{time} निफ्राय {area} आव {phrase}, जेबो खामानि लानाय जायाखै",
        "{area} आव {phrase} जाहोनाव गोजौनफोर जेंना मोनथि",
        "अननायनो {area} आव {phrase} गोख्रों लाफां सोमजि हो",
    ],
    "Dogri": [
        "{area} च {phrase} दी गम्भीर समस्या ऐ",
        "{time} तों {area} च {phrase}, कोई कार्रवाई नेई होई",
        "{area} च {phrase} दी वजा कन्नै मरीज़ परेशान न",
        "मेहरबानी करियै {area} च {phrase} दा फ़ौरन हल करो",
    ],
    "Kashmiri": [
        "{area} منز {phrase} بڈ مسئلہ چھُ",
        "{time} پیٹھ {area} منز {phrase}، کانہہ ایکشن چھُ نہ گومُت",
        "{area} منز {phrase} بَپتھ مریض پریشان چھِ",
        "مہربٲنی کٔرِتھ {area} منز {phrase} فوری حل کٔرِو",
    ],
    "Sanskrit": [
        "{area} क्षेत्रे {phrase} इति गुरुतरा समस्या वर्तते",
        "{time} यावत् {area} क्षेत्रे {phrase}, न कोऽपि उपायः कृतः",
        "{area} क्षेत्रे {phrase} कारणात् रोगिणः कष्टम् अनुभवन्ति",
        "कृपया {area} क्षेत्रे {phrase} शीघ्रं समाधानं कुर्वन्तु",
    ],
}


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 4 — CATEGORY-SPECIFIC COMPLAINT PHRASES (MULTILINGUAL)
# ════════════════════════════════════════════════════════════════════════════

CATEGORY_PHRASES: Dict[str, Dict[str, List[str]]] = {

    "Infrastructure": {
        "English": ["roof is leaking badly", "walls have deep cracks", "floor tiles are broken", "ceiling plaster is falling", "staircase railing is broken", "doors cannot close", "windows are shattered", "drainage is completely blocked", "building looks unsafe"],
        "Hindi": ["छत से पानी टपक रहा है", "दीवारों में दरारें हैं", "फर्श की टाइलें टूटी हैं", "छत का प्लास्टर गिर रहा है", "सीढ़ी की रेलिंग टूटी है", "दरवाज़े बंद नहीं होते", "खिड़कियाँ टूटी हुई हैं", "नाली बंद है", "इमारत असुरक्षित है"],
        "Marathi": ["छत गळतंय", "भिंतींना तडे गेलेत", "फरशी तुटलीय", "प्लास्टर पडतंय", "रेलिंग तुटलीय", "दरवाजे बंद होत नाहीत", "खिडक्या फुटल्या", "गटार तुंबलीय"],
        "Tamil": ["கூரை கசிகிறது", "சுவரில் விரிசல்", "தரைத்தகடு உடைந்தது", "பூச்சு விழுகிறது", "படிக்கட்டு உடைந்தது", "கதவு மூடாது", "ஜன்னல் உடைந்தது", "வடிகால் அடைப்பு"],
        "Telugu": ["కురుస్తున్న పైకప్పు", "గోడల్లో పగుళ్ళు", "పగిలిన ఫ్లోర్ టైల్స్", "ఊడిపడుతున్న ప్లాస్టర్", "విరిగిన రెయిలింగ్", "తలుపులు మూసుకోవు", "విరిగిన కిటికీలు", "బ్లాక్ అయిన మురుగు"],
        "Bengali": ["ছাদ থেকে জল পড়ছে", "দেওয়ালে ফাটল", "ভাঙা মেঝে", "প্লাস্টার খসে পড়ছে", "রেলিং ভাঙা", "দরজা বন্ধ হয় না", "জানালা ভাঙা", "নর্দমা বন্ধ"],
        "Gujarati": ["છત ટપકે છે", "દીવાલોમાં તિરાડ", "ટાઈલ્સ તૂટી ગઈ", "પ્લાસ્ટર ખરી રહ્યું છે", "રેલિંગ તૂટી ગઈ", "દરવાજા બંધ નથી થતા", "બારીઓ તૂટેલી", "ગટર ભરાયેલ"],
        "Kannada": ["ಛಾವಣಿ ಸೋರುತ್ತಿದೆ", "ಗೋಡೆಯಲ್ಲಿ ಬಿರುಕು", "ನೆಲದ ಟೈಲ್ಸ್ ಮುರಿದಿವೆ", "ಪ್ಲಾಸ್ಟರ್ ಬೀಳುತ್ತಿದೆ", "ಮೆಟ್ಟಿಲ ರೇಲಿಂಗ್ ಮುರಿದಿದೆ", "ಬಾಗಿಲು ಮುಚ್ಚುವುದಿಲ್ಲ", "ಕಿಟಕಿ ಮುರಿದಿದೆ", "ಚರಂಡಿ ಕಟ್ಟಿಕೊಂಡಿದೆ"],
        "Malayalam": ["മേൽക്കൂര ചോരുന്നു", "ചുമരിൽ വിള്ളൽ", "തറയോടുകൾ പൊട്ടി", "പ്ലാസ്റ്റർ ഇളകുന്നു", "കൈവരി ഒടിഞ്ഞു", "വാതിൽ അടയുന്നില്ല", "ജനാല പൊട്ടി", "ഓടകൾ അടഞ്ഞു"],
        "Punjabi": ["ਛੱਤ ਟਪਕ ਰਹੀ ਹੈ", "ਦੀਵਾਰਾਂ ਵਿੱਚ ਤਰੇੜਾਂ", "ਫਰਸ਼ ਟੁੱਟਿਆ ਪਿਆ ਹੈ", "ਪਲਸਤਰ ਡਿੱਗ ਰਿਹਾ ਹੈ", "ਰੇਲਿੰਗ ਟੁੱਟੀ ਪਈ", "ਬੂਹੇ ਬੰਦ ਨਹੀਂ ਹੁੰਦੇ", "ਖਿੜਕੀਆਂ ਟੁੱਟੀਆਂ", "ਨਾਲੀ ਬੰਦ ਹੈ"],
        "Odia": ["ଛାତ ଲିକ୍ ହେଉଛି", "କାନ୍ଥରେ ଫାଟ", "ଫ୍ଲୋର ଟାଇଲ୍ ଭାଙ୍ଗିଛି", "ପ୍ଲାଷ୍ଟର ଖସୁଛି", "ସିଡ଼ି ଭାଙ୍ଗିଛି", "ଦ୍ୱାର ବନ୍ଦ ହେଉନାହିଁ"],
        "Assamese": ["চাল লিক হৈছে", "বেৰত ফাট", "মজিয়া ভাঙি গৈছে", "প্লাষ্টাৰ সৰি আছে", "ৰেলিং ভাঙি গৈছে", "দৰ্জা বন্ধ নহয়"],
        "Urdu": ["چھت سے پانی ٹپک رہا ہے", "دیواروں میں دراڑیں ہیں", "فرش ٹوٹا ہوا ہے", "پلاسٹر گر رہا ہے", "ریلنگ ٹوٹی ہوئی ہے", "دروازے بند نہیں ہوتے"],
        "Konkani": ["वयर उदक गळटा", "वणटींक तडे गेल्यात", "फरशी मोडली", "प्लॅस्टर पडटा", "रेलिंग मोडली"],
        "Sanskrit": ["छदिः स्रवति", "भित्तिषु विदराणि सन्ति", "भूतलं भग्नम्", "लेपनं पतति"],
    },

    "Medicine Stock": {
        "English": ["essential medicines are out of stock", "insulin not available for diabetic patients", "antibiotics unavailable in pharmacy", "paracetamol has been unavailable for days", "blood pressure medicines have run out", "ORS packets not being given", "TB medicines not in stock", "vaccines are unavailable", "emergency drugs expired"],
        "Hindi": ["ज़रूरी दवाइयों का स्टॉक ख़त्म है", "शुगर मरीज़ों को इंसुलिन नहीं मिल रहा", "एंटीबायोटिक दवाइयाँ नहीं हैं", "कई दिनों से पेरासिटामोल नहीं मिला", "बीपी की दवाइयाँ ख़त्म हो गईं", "ओआरएस पैकेट नहीं दिए जा रहे", "टीबी की दवा स्टॉक में नहीं", "टीके उपलब्ध नहीं", "इमरजेंसी दवाइयाँ एक्सपायर हो चुकी हैं"],
        "Marathi": ["आवश्यक औषधांचा साठा संपला", "इन्सुलिन उपलब्ध नाही", "अँटीबायोटिक्स नाहीत", "पॅरासिटामॉल मिळत नाही", "बीपीची औषधे संपली", "ओआरएस पॅकेट मिळत नाहीत", "टीबीची औषधे नाहीत"],
        "Tamil": ["அத்தியாவசிய மருந்துகள் இல்லை", "இன்சுலின் கிடைக்கவில்லை", "ஆண்டிபயாடிக் மருந்துகள் இல்லை", "பாராசிட்டமால் பல நாட்களாக கிடைக்கவில்லை", "ரத்த அழுத்த மாத்திரைகள் தீர்ந்தன", "தடுப்பூசிகள் இல்லை"],
        "Telugu": ["అవసరమైన మందులు అందుబాటులో లేవు", "ఇన్సులిన్ దొరకడం లేదు", "యాంటీబయాటిక్స్ లేవు", "పారాసిటమాల్ చాలా రోజులుగా లేదు", "బీపీ మందులు అయిపోయాయి", "వ్యాక్సిన్లు అందుబాటులో లేవు"],
        "Bengali": ["প্রয়োজনীয় ওষুধের স্টক শেষ", "ইনসুলিন পাওয়া যাচ্ছে না", "অ্যান্টিবায়োটিক নেই", "প্যারাসিটামল অনেকদিন ধরে নেই", "বিপির ওষুধ ফুরিয়ে গেছে", "টিকা পাওয়া যাচ্ছে না"],
        "Gujarati": ["જરૂરી દવાઓનો સ્ટોક ખતમ છે", "ઇન્સ્યુલિન ઉપલબ્ધ નથી", "એન્ટિબાયોટિક દવાઓ નથી", "પેરાસિટામોલ ઘણા દિવસથી મળતી નથી", "બીપીની દવાઓ ખૂટી ગઈ"],
        "Kannada": ["ಅಗತ್ಯ ಔಷಧಗಳ ಸ್ಟಾಕ್ ಖಾಲಿ", "ಇನ್ಸುಲಿನ್ ಸಿಗುತ್ತಿಲ್ಲ", "ಆಂಟಿಬಯೋಟಿಕ್ ಇಲ್ಲ", "ಪ್ಯಾರಾಸಿಟಮಾಲ್ ಹಲವು ದಿನಗಳಿಂದ ಸಿಗುತ್ತಿಲ್ಲ", "ಲಸಿಕೆಗಳು ಲಭ್ಯವಿಲ್ಲ"],
        "Malayalam": ["അത്യാവശ്യ മരുന്നുകൾ സ്റ്റോക്ക് തീർന്നു", "ഇൻസുലിൻ ലഭ്യമല്ല", "ആന്റിബയോട്ടിക്ക് ഇല്ല", "പാരസെറ്റമോൾ ദിവസങ്ങളായി കിട്ടുന്നില്ല", "വാക്സിനുകൾ ലഭ്യമല്ല"],
        "Punjabi": ["ਜ਼ਰੂਰੀ ਦਵਾਈਆਂ ਦਾ ਸਟਾਕ ਖ਼ਤਮ ਹੈ", "ਇਨਸੁਲਿਨ ਨਹੀਂ ਮਿਲ ਰਹੀ", "ਐਂਟੀਬਾਇਓਟਿਕ ਨਹੀਂ ਹਨ", "ਪੈਰਾਸੀਟਾਮੋਲ ਕਈ ਦਿਨਾਂ ਤੋਂ ਨਹੀਂ ਮਿਲੀ", "ਬੀਪੀ ਦੀਆਂ ਦਵਾਈਆਂ ਖ਼ਤਮ ਹੋ ਗਈਆਂ"],
        "Urdu": ["ضروری ادویات ختم ہوچکی ہیں", "انسولین دستیاب نہیں", "اینٹی بائیوٹکس نہیں ہیں", "پیراسٹامول کئی دنوں سے نہیں ملی"],
    },

    "Medical Equipment": {
        "English": ["ventilator is not working", "ECG machine is broken", "X-ray machine has been down for weeks", "ultrasound machine malfunctioning", "defibrillator is missing from emergency", "pulse oximeter not available", "BP monitor giving wrong readings", "oxygen concentrator is faulty"],
        "Hindi": ["वेंटिलेटर काम नहीं कर रहा", "ईसीजी मशीन खराब है", "एक्स-रे मशीन हफ़्तों से बंद है", "अल्ट्रासाउंड मशीन ठीक से काम नहीं कर रही", "इमरजेंसी में डीफ़िब्रिलेटर नहीं है", "पल्स ऑक्सीमीटर उपलब्ध नहीं", "बीपी मशीन ग़लत रीडिंग दे रही"],
        "Marathi": ["व्हेंटिलेटर काम करत नाही", "ईसीजी मशीन बंद आहे", "एक्स-रे मशीन आठवड्यांपासून बंद", "अल्ट्रासाउंड खराब आहे", "डिफिब्रिलेटर नाही"],
        "Tamil": ["வென்டிலேட்டர் வேலை செய்யவில்லை", "ஈசிஜி இயந்திரம் பழுதடைந்துள்ளது", "எக்ஸ்-ரே இயந்திரம் வாரங்களாக செயல்படவில்லை", "அல்ட்ராசவுண்ட் சரியாக வேலை செய்யவில்லை"],
        "Telugu": ["వెంటిలేటర్ పనిచేయడం లేదు", "ఈసీజీ మెషీన్ పాడైంది", "ఎక్స్-రే మెషీన్ వారాలుగా పనిచేయడం లేదు", "అల్ట్రాసౌండ్ సరిగ్గా పనిచేయడం లేదు"],
        "Bengali": ["ভেন্টিলেটর কাজ করছে না", "ইসিজি মেশিন নষ্ট", "এক্স-রে মেশিন সপ্তাহ ধরে বন্ধ", "আল্ট্রাসাউন্ড ঠিকমতো কাজ করছে না"],
        "Gujarati": ["વેન્ટિલેટર કામ નથી કરતું", "ઈસીજી મશીન ખરાબ છે", "એક્સ-રે મશીન અઠવાડિયાથી બંધ છે"],
        "Kannada": ["ವೆಂಟಿಲೇಟರ್ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ", "ಇಸಿಜಿ ಯಂತ್ರ ಕೆಟ್ಟಿದೆ", "ಎಕ್ಸ್-ರೇ ಯಂತ್ರ ವಾರಗಳಿಂದ ನಿಂತಿದೆ"],
        "Malayalam": ["വെന്റിലേറ്റർ പ്രവർത്തിക്കുന്നില്ല", "ഇസിജി മെഷീൻ കേടായി", "എക്സ്-റേ മെഷീൻ ആഴ്ചകളായി പ്രവർത്തിക്കുന്നില്ല"],
        "Punjabi": ["ਵੈਂਟੀਲੇਟਰ ਕੰਮ ਨਹੀਂ ਕਰ ਰਿਹਾ", "ਈਸੀਜੀ ਮਸ਼ੀਨ ਖ਼ਰਾਬ ਹੈ", "ਐਕਸ-ਰੇ ਮਸ਼ੀਨ ਹਫ਼ਤਿਆਂ ਤੋਂ ਬੰਦ ਹੈ"],
        "Urdu": ["وینٹیلیٹر کام نہیں کر رہا", "ای سی جی مشین خراب ہے", "ایکس رے مشین ہفتوں سے بند ہے"],
    },

    "Doctor Availability": {
        "English": ["doctor did not come today", "specialist doctor never available", "no doctor in emergency at night", "only one doctor for entire hospital", "doctor comes late every day", "surgeon not available for weeks", "gynaecologist posted but never present", "paediatrician not available"],
        "Hindi": ["आज डॉक्टर नहीं आए", "स्पेशलिस्ट डॉक्टर कभी उपलब्ध नहीं", "रात में इमरजेंसी में कोई डॉक्टर नहीं", "पूरे अस्पताल में सिर्फ़ एक डॉक्टर", "डॉक्टर रोज़ लेट आते हैं", "हफ़्तों से सर्जन उपलब्ध नहीं", "गायनेकोलॉजिस्ट तैनात है पर आती नहीं"],
        "Marathi": ["आज डॉक्टर आले नाहीत", "स्पेशलिस्ट कधीच नसतात", "रात्री इमर्जन्सीत डॉक्टर नाही", "संपूर्ण हॉस्पिटलमध्ये एकच डॉक्टर", "डॉक्टर दररोज उशीरा येतात"],
        "Tamil": ["இன்று மருத்துவர் வரவில்லை", "சிறப்பு மருத்துவர் எப்போதும் இல்லை", "இரவு நேரத்தில் அவசர சிகிச்சையில் மருத்துவர் இல்லை", "முழு மருத்துவமனைக்கும் ஒரே ஒரு மருத்துவர்"],
        "Telugu": ["ఈ రోజు డాక్టర్ రాలేదు", "స్పెషలిస్ట్ డాక్టర్ ఎప్పుడూ అందుబాటులో ఉండరు", "రాత్రి ఎమర్జెన్సీలో డాక్టర్ లేరు", "మొత్తం ఆస్పత్రికి ఒక్క డాక్టర్"],
        "Bengali": ["আজ ডাক্তার আসেননি", "স্পেশালিস্ট ডাক্তার কখনো থাকেন না", "রাতে ইমার্জেন্সিতে কোনো ডাক্তার নেই", "পুরো হাসপাতালে মাত্র একজন ডাক্তার"],
        "Gujarati": ["આજે ડૉક્ટર આવ્યા નથી", "સ્પેશિયાલિસ્ટ ક્યારેય ઉપલબ્ધ નથી", "રાત્રે ઇમરજન્સીમાં ડૉક્ટર નથી", "આખી હોસ્પિટલમાં એક જ ડૉક્ટર"],
        "Kannada": ["ಇಂದು ವೈದ್ಯರು ಬಂದಿಲ್ಲ", "ತಜ್ಞ ವೈದ್ಯರು ಎಂದೂ ಲಭ್ಯವಿಲ್ಲ", "ರಾತ್ರಿ ತುರ್ತು ವಿಭಾಗದಲ್ಲಿ ವೈದ್ಯರಿಲ್ಲ"],
        "Malayalam": ["ഇന്ന് ഡോക്ടർ വന്നില്ല", "സ്പെഷ്യലിസ്റ്റ് ഒരിക്കലും ലഭ്യമല്ല", "രാത്രി എമർജൻസിയിൽ ഡോക്ടർ ഇല്ല"],
        "Punjabi": ["ਅੱਜ ਡਾਕਟਰ ਨਹੀਂ ਆਇਆ", "ਸਪੈਸ਼ਲਿਸਟ ਕਦੇ ਵੀ ਉਪਲਬਧ ਨਹੀਂ", "ਰਾਤ ਨੂੰ ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਕੋਈ ਡਾਕਟਰ ਨਹੀਂ"],
        "Urdu": ["آج ڈاکٹر نہیں آیا", "ماہر ڈاکٹر کبھی دستیاب نہیں", "رات میں ایمرجنسی میں کوئی ڈاکٹر نہیں"],
    },

    "Nurse Behaviour": {
        "English": ["nurse was very rude to patient", "nurse shouted at elderly patient", "staff nurse demanding money from patient", "nurse refused to attend to patient at night", "nursing staff sleeping during duty", "nurse not giving medicines on time", "nurse behaving rudely with family"],
        "Hindi": ["नर्स ने मरीज़ से बदतमीज़ी की", "नर्स ने बुज़ुर्ग मरीज़ पर चिल्लाया", "नर्स मरीज़ से पैसे माँग रही है", "रात में नर्स ने मरीज़ को देखने से मना किया", "नर्स ड्यूटी पर सो रही थी", "नर्स समय पर दवा नहीं दे रही", "नर्स परिवार से बुरा बर्ताव कर रही"],
        "Marathi": ["नर्सने रुग्णाशी उद्धटपणे वागले", "नर्सने वृद्ध रुग्णावर ओरडले", "नर्स पैसे मागतेय", "रात्री नर्सने रुग्णाकडे पाहिले नाही", "नर्स ड्यूटीवर झोपलेली"],
        "Tamil": ["செவிலியர் நோயாளியிடம் கடுமையாக நடந்துகொண்டார்", "செவிலியர் முதியவர் மீது கத்தினார்", "செவிலியர் பணம் கேட்கிறார்", "இரவில் செவிலியர் நோயாளியை கவனிக்கவில்லை"],
        "Telugu": ["నర్స్ రోగితో అసభ్యంగా ప్రవర్తించింది", "నర్స్ వృద్ధ రోగిపై అరిచింది", "నర్స్ డబ్బులు అడుగుతోంది", "రాత్రి నర్స్ రోగిని చూడలేదు"],
        "Bengali": ["নার্স রোগীর সাথে বদমেজাজি করেছে", "নার্স বৃদ্ধ রোগীকে চেঁচিয়েছে", "নার্স টাকা দাবি করছে", "রাতে নার্স রোগী দেখেনি"],
        "Gujarati": ["નર્સ દર્દી સાથે ખરાબ વર્તન કરે છે", "નર્સ વૃદ્ધ દર્દી પર બૂમો પાડે છે", "નર્સ પૈસા માંગે છે"],
        "Kannada": ["ನರ್ಸ್ ರೋಗಿಯೊಂದಿಗೆ ಕೆಟ್ಟದಾಗಿ ವರ್ತಿಸಿದರು", "ನರ್ಸ್ ವೃದ್ಧ ರೋಗಿಗೆ ಕೂಗಿದರು", "ನರ್ಸ್ ಹಣ ಕೇಳುತ್ತಿದ್ದಾರೆ"],
        "Malayalam": ["നഴ്സ് രോഗിയോട് മോശമായി പെരുമാറി", "നഴ്സ് വയോധികനോട് കയർത്തു", "നഴ്സ് പണം ആവശ്യപ്പെടുന്നു"],
        "Punjabi": ["ਨਰਸ ਨੇ ਮਰੀਜ਼ ਨਾਲ ਬਦਤਮੀਜ਼ੀ ਕੀਤੀ", "ਨਰਸ ਨੇ ਬਜ਼ੁਰਗ ਮਰੀਜ਼ ਤੇ ਰੌਲਾ ਪਾਇਆ", "ਨਰਸ ਪੈਸੇ ਮੰਗ ਰਹੀ ਹੈ"],
        "Urdu": ["نرس نے مریض سے بدتمیزی کی", "نرس نے بزرگ مریض پر چیخا", "نرس پیسے مانگ رہی ہے"],
    },

    "Hospital Staff": {
        "English": ["ward boy not available", "sweeper has not cleaned since morning", "security guard misbehaving with visitors", "pharmacist not at counter", "lab technician absent without notice", "registration clerk demanding extra fees", "ambulance driver drinking on duty"],
        "Hindi": ["वार्ड बॉय उपलब्ध नहीं है", "सफ़ाई कर्मचारी ने सुबह से सफ़ाई नहीं की", "सिक्योरिटी गार्ड आगंतुकों से बदसलूकी कर रहा", "फार्मासिस्ट काउंटर पर नहीं है", "लैब तकनीशियन बिना सूचना ग़ायब", "रजिस्ट्रेशन क्लर्क अतिरिक्त फ़ीस माँग रहा"],
        "Marathi": ["वॉर्ड बॉय उपलब्ध नाही", "सफाई कर्मचाऱ्याने सकाळपासून सफाई केली नाही", "सिक्युरिटी गार्ड अभ्यागतांशी गैरवर्तन करतो", "फार्मासिस्ट काउंटरवर नाही"],
        "Tamil": ["வார்ட் பாய் இல்லை", "காலை முதல் சுத்தம் செய்யப்படவில்லை", "பாதுகாவலர் வருபவர்களிடம் மோசமாக நடந்துகொள்கிறார்", "மருந்தாளுநர் கவுண்டரில் இல்லை"],
        "Telugu": ["వార్డ్ బాయ్ అందుబాటులో లేడు", "ఉదయం నుండి శుభ్రం చేయలేదు", "సెక్యూరిటీ గార్డ్ సందర్శకులతో దుర్మార్గంగా ప్రవర్తిస్తున్నాడు"],
        "Bengali": ["ওয়ার্ড বয় পাওয়া যাচ্ছে না", "সকাল থেকে পরিষ্কার করা হয়নি", "সিকিউরিটি গার্ড দর্শনার্থীদের সাথে দুর্ব্যবহার করছে"],
        "Gujarati": ["વૉર્ડ બોય ઉપલબ્ધ નથી", "સફાઈ કર્મચારીએ સવારથી સફાઈ કરી નથી", "સિક્યોરિટી ગાર્ડ મુલાકાતીઓ સાથે ગેરવર્તન કરે છે"],
        "Kannada": ["ವಾರ್ಡ್ ಬಾಯ್ ಲಭ್ಯವಿಲ್ಲ", "ಬೆಳಿಗ್ಗೆಯಿಂದ ಸ್ವಚ್ಛಗೊಳಿಸಿಲ್ಲ", "ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ ಸಂದರ್ಶಕರೊಂದಿಗೆ ದುರ್ನಡತೆ ತೋರುತ್ತಿದ್ದಾರೆ"],
        "Malayalam": ["വാർഡ് ബോയ് ലഭ്യമല്ല", "രാവിലെ മുതൽ വൃത്തിയാക്കിയിട്ടില്ല", "സെക്യൂരിറ്റി ഗാർഡ് സന്ദർശകരോട് മോശമായി പെരുമാറുന്നു"],
        "Punjabi": ["ਵਾਰਡ ਬੁਆਏ ਉਪਲਬਧ ਨਹੀਂ", "ਸਵੇਰੇ ਤੋਂ ਸਫ਼ਾਈ ਨਹੀਂ ਹੋਈ", "ਸਿਕਿਓਰਿਟੀ ਗਾਰਡ ਲੋਕਾਂ ਨਾਲ ਬਦਸਲੂਕੀ ਕਰ ਰਿਹਾ"],
    },

    "Cleanliness": {
        "English": ["hospital premises are filthy", "toilets are extremely dirty", "blood stains on bed sheets not changed", "garbage scattered everywhere", "cockroaches and rats in ward", "dirty syringes lying around", "operation theatre not sanitized", "drinking water area is unclean"],
        "Hindi": ["अस्पताल परिसर बहुत गंदा है", "शौचालय बेहद गंदे हैं", "बिस्तर की चादर पर खून के दाग बदले नहीं गए", "हर जगह कूड़ा फैला हुआ है", "वार्ड में कॉकरोच और चूहे हैं", "इस्तेमाल की हुई सीरिंज पड़ी हुई हैं", "ओटी साफ़ नहीं है"],
        "Marathi": ["हॉस्पिटल परिसर अत्यंत घाण आहे", "शौचालये अत्यंत अस्वच्छ", "बेडशीटवर रक्ताचे डाग बदलले नाहीत", "सगळीकडे कचरा पसरलेला", "वॉर्डमध्ये झुरळे आणि उंदीर"],
        "Tamil": ["மருத்துவமனை வளாகம் அழுக்காக உள்ளது", "கழிப்பறைகள் மிகவும் அசுத்தமாக உள்ளன", "படுக்கை விரிப்புகளில் ரத்தக் கறை மாற்றப்படவில்லை", "எல்லா இடத்திலும் குப்பை"],
        "Telugu": ["ఆస్పత్రి ప్రాంగణం చాలా మురికిగా ఉంది", "టాయిలెట్లు అత్యంత మురికిగా ఉన్నాయి", "బెడ్ షీట్లపై రక్తపు మరకలు మారలేదు", "చెత్త అంతటా పడి ఉంది"],
        "Bengali": ["হাসপাতাল প্রাঙ্গণ অত্যন্ত নোংরা", "টয়লেট অত্যন্ত নোংরা", "বেডশিটে রক্তের দাগ বদলানো হয়নি", "সর্বত্র আবর্জনা ছড়িয়ে আছে"],
        "Gujarati": ["હોસ્પિટલ પરિસર ખૂબ ગંદું છે", "ટોઇલેટ ખૂબ ગંદા છે", "બેડશીટ પર લોહીના ડાઘ બદલ્યા નથી", "ચારે બાજુ કચરો ફેલાયેલો છે"],
        "Kannada": ["ಆಸ್ಪತ್ರೆ ಆವರಣ ತುಂಬಾ ಕೊಳಕಾಗಿದೆ", "ಶೌಚಾಲಯಗಳು ತುಂಬಾ ಗಲೀಜಾಗಿವೆ", "ಬೆಡ್ ಶೀಟ್ ಮೇಲೆ ರಕ್ತದ ಕಲೆ ಬದಲಾಯಿಸಿಲ್ಲ"],
        "Malayalam": ["ആശുപത്രി പരിസരം വൃത്തിഹീനം", "ടോയ്ലറ്റുകൾ വളരെ വൃത്തികെട്ടതാണ്", "ബെഡ്ഷീറ്റിലെ ചോരപ്പാടുകൾ മാറ്റിയിട്ടില്ല"],
        "Punjabi": ["ਹਸਪਤਾਲ ਬਹੁਤ ਗੰਦਾ ਹੈ", "ਪਖਾਨੇ ਬਹੁਤ ਗੰਦੇ ਹਨ", "ਬੈੱਡ ਸ਼ੀਟ ਤੇ ਖ਼ੂਨ ਦੇ ਧੱਬੇ ਬਦਲੇ ਨਹੀਂ ਗਏ"],
    },

    "Electricity": {
        "English": ["power outage in the hospital", "electricity has been out since morning", "voltage fluctuation damaging equipment", "fans not working in patient wards", "AC not working in operation theatre", "lights not working in corridor", "emergency lights are non-functional", "exposed wires in patient ward"],
        "Hindi": ["अस्पताल में बिजली कट गई है", "सुबह से बिजली नहीं आई", "वोल्टेज में उतार-चढ़ाव से उपकरण खराब हो रहे हैं", "वार्ड में पंखे चालू नहीं हैं", "ओटी में एसी काम नहीं कर रहा", "गलियारे में लाइटें बंद हैं", "इमरजेंसी लाइटें काम नहीं कर रहीं"],
        "Marathi": ["हॉस्पिटलमध्ये वीज गेली", "सकाळपासून वीज नाही", "व्होल्टेज चढ-उतारामुळे उपकरणे खराब होत आहेत", "वॉर्डमध्ये पंखे चालू नाहीत"],
        "Tamil": ["மருத்துவமனையில் மின்தடை", "காலை முதல் மின்சாரம் இல்லை", "மின்னழுத்த ஏற்ற இறக்கம் கருவிகளை சேதப்படுத்துகிறது", "வார்டில் மின்விசிறிகள் வேலை செய்யவில்லை"],
        "Telugu": ["ఆస్పత్రిలో విద్యుత్ అంతరాయం", "ఉదయం నుండి కరెంట్ లేదు", "వోల్టేజ్ హెచ్చు తగ్గులు పరికరాలను పాడుచేస్తున్నాయి"],
        "Bengali": ["হাসপাতালে বিদ্যুৎ নেই", "সকাল থেকে কারেন্ট নেই", "ভোল্টেজ ওঠানামায় যন্ত্রপাতি নষ্ট হচ্ছে"],
        "Gujarati": ["હોસ્પિટલમાં વીજળી ગઈ છે", "સવારથી વીજળી નથી", "વોલ્ટેજ વધઘટથી ઉપકરણો ખરાબ થઈ રહ્યાં છે"],
        "Kannada": ["ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ವಿದ್ಯುತ್ ಕಡಿತ", "ಬೆಳಿಗ್ಗೆಯಿಂದ ಕರೆಂಟ್ ಇಲ್ಲ", "ವೋಲ್ಟೇಜ್ ಏರಿಳಿತದಿಂದ ಉಪಕರಣಗಳು ಹಾಳಾಗುತ್ತಿವೆ"],
        "Malayalam": ["ആശുപത്രിയിൽ വൈദ്യുതി നിലച്ചു", "രാവിലെ മുതൽ കറണ്ട് ഇല്ല", "വോൾട്ടേജ് ഏറ്റക്കുറച്ചിൽ ഉപകരണങ്ങൾ കേടാകുന്നു"],
        "Punjabi": ["ਹਸਪਤਾਲ ਵਿੱਚ ਬਿਜਲੀ ਗਈ ਹੈ", "ਸਵੇਰੇ ਤੋਂ ਬਿਜਲੀ ਨਹੀਂ ਆਈ", "ਵੋਲਟੇਜ ਦੇ ਉਤਾਰ-ਚੜ੍ਹਾਅ ਨਾਲ ਸਾਮਾਨ ਖ਼ਰਾਬ ਹੋ ਰਿਹਾ"],
    },

    "Water Supply": {
        "English": ["no water supply in the hospital", "water is dirty and contaminated", "water pump has broken down", "overhead tank is empty", "taps are not working in toilets", "no hot water for patients", "water purifier is broken", "water has foul smell"],
        "Hindi": ["अस्पताल में पानी की सप्लाई नहीं है", "पानी गंदा और दूषित है", "पानी का पंप खराब है", "ओवरहेड टैंक खाली है", "शौचालय में नल काम नहीं कर रहे", "मरीज़ों को गरम पानी नहीं मिल रहा", "वाटर प्यूरीफ़ायर खराब है"],
        "Marathi": ["हॉस्पिटलमध्ये पाण्याचा पुरवठा नाही", "पाणी घाण आणि दूषित आहे", "पाण्याचा पंप बंद पडला", "ओव्हरहेड टँक रिकामा", "शौचालयातील नळ चालू नाहीत"],
        "Tamil": ["மருத்துவமனையில் தண்ணீர் வரவில்லை", "தண்ணீர் அசுத்தமாக உள்ளது", "தண்ணீர் பம்ப் பழுதடைந்துள்ளது", "மேல்நிலை தொட்டி காலியாக உள்ளது"],
        "Telugu": ["ఆస్పత్రిలో నీటి సరఫరా లేదు", "నీరు మురికిగా కలుషితంగా ఉంది", "వాటర్ పంప్ పాడైంది", "ఓవర్ హెడ్ ట్యాంక్ ఖాళీగా ఉంది"],
        "Bengali": ["হাসপাতালে জলের সরবরাহ নেই", "জল নোংরা ও দূষিত", "জলের পাম্প খারাপ হয়ে গেছে", "ওভারহেড ট্যাংক খালি"],
        "Gujarati": ["હોસ્પિટલમાં પાણીનો પુરવઠો નથી", "પાણી ગંદું અને દૂષિત છે", "પાણીનો પંપ ખરાબ છે"],
        "Kannada": ["ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ನೀರಿನ ಸರಬರಾಜು ಇಲ್ಲ", "ನೀರು ಕೊಳಕಾಗಿದೆ", "ನೀರಿನ ಪಂಪ್ ಕೆಟ್ಟಿದೆ"],
        "Malayalam": ["ആശുപത്രിയിൽ ജലവിതരണം ഇല്ല", "വെള്ളം മലിനമാണ്", "വാട്ടർ പമ്പ് കേടായി"],
        "Punjabi": ["ਹਸਪਤਾਲ ਵਿੱਚ ਪਾਣੀ ਦੀ ਸਪਲਾਈ ਨਹੀਂ", "ਪਾਣੀ ਗੰਦਾ ਤੇ ਦੂਸ਼ਿਤ ਹੈ", "ਪਾਣੀ ਦਾ ਪੰਪ ਖ਼ਰਾਬ ਹੈ"],
    },

    "Ambulance": {
        "English": ["ambulance not available when needed", "108 ambulance service not responding", "ambulance arrived very late", "ambulance has no oxygen cylinder", "ambulance driver was absent", "ambulance in poor condition and not maintained", "no ambulance for emergency transfer"],
        "Hindi": ["ज़रूरत पर एम्बुलेंस नहीं मिली", "108 एम्बुलेंस सेवा ने जवाब नहीं दिया", "एम्बुलेंस बहुत देर से आई", "एम्बुलेंस में ऑक्सीजन सिलिंडर नहीं था", "एम्बुलेंस ड्राइवर ग़ायब था", "एम्बुलेंस खराब हालत में है"],
        "Marathi": ["गरजेला अँब्युलन्स मिळाली नाही", "108 अँब्युलन्स सेवेने प्रतिसाद दिला नाही", "अँब्युलन्स खूप उशीरा आली", "अँब्युलन्समध्ये ऑक्सिजन सिलिंडर नव्हता"],
        "Tamil": ["தேவையான நேரத்தில் ஆம்புலன்ஸ் கிடைக்கவில்லை", "108 ஆம்புலன்ஸ் சேவை பதிலளிக்கவில்லை", "ஆம்புலன்ஸ் மிகவும் தாமதமாக வந்தது"],
        "Telugu": ["అవసరమైనప్పుడు అంబులెన్స్ అందుబాటులో లేదు", "108 అంబులెన్స్ సేవ స్పందించలేదు", "అంబులెన్స్ చాలా ఆలస్యంగా వచ్చింది"],
        "Bengali": ["প্রয়োজনের সময় অ্যাম্বুলেন্স পাওয়া যায়নি", "108 অ্যাম্বুলেন্স সেবা সাড়া দেয়নি", "অ্যাম্বুলেন্স অনেক দেরিতে এসেছে"],
        "Gujarati": ["જરૂર સમયે એમ્બ્યુલન્સ ન મળી", "108 એમ્બ્યુલન્સ સેવાનો કોઈ જવાબ નથી", "એમ્બ્યુલન્સ ખૂબ મોડી આવી"],
        "Kannada": ["ಅಗತ್ಯವಿದ್ದಾಗ ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಗಲಿಲ್ಲ", "108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೇವೆ ಪ್ರತಿಕ್ರಿಯಿಸಲಿಲ್ಲ", "ಆಂಬ್ಯುಲೆನ್ಸ್ ತುಂಬಾ ತಡವಾಗಿ ಬಂದಿತು"],
        "Malayalam": ["ആവശ്യത്തിന് ആംബുലൻസ് കിട്ടിയില്ല", "108 ആംബുലൻസ് സേവനം പ്രതികരിക്കുന്നില്ല", "ആംബുലൻസ് വളരെ വൈകി വന്നു"],
        "Punjabi": ["ਲੋੜ ਪੈਣ ਤੇ ਐਂਬੂਲੈਂਸ ਨਹੀਂ ਮਿਲੀ", "108 ਐਂਬੂਲੈਂਸ ਸੇਵਾ ਨੇ ਜਵਾਬ ਨਹੀਂ ਦਿੱਤਾ", "ਐਂਬੂਲੈਂਸ ਬਹੁਤ ਦੇਰ ਨਾਲ ਆਈ"],
    },

    "Blood Bank": {
        "English": ["blood not available in blood bank", "no O-negative blood available", "blood bank refrigerator not working", "blood not screened properly", "expired blood units found", "no blood bank technician present"],
        "Hindi": ["ब्लड बैंक में खून उपलब्ध नहीं", "ओ-नेगेटिव ब्लड नहीं है", "ब्लड बैंक का फ्रिज काम नहीं कर रहा", "खून की जाँच ठीक से नहीं हो रही", "एक्सपायर्ड ब्लड यूनिट मिले"],
        "Marathi": ["ब्लड बँकेत रक्त उपलब्ध नाही", "ओ-निगेटिव्ह रक्त नाही", "ब्लड बँकेचा फ्रीज काम करत नाही"],
        "Tamil": ["இரத்த வங்கியில் இரத்தம் இல்லை", "ஓ-நெகட்டிவ் இரத்தம் கிடைக்கவில்லை", "இரத்த வங்கி குளிர்சாதனப் பெட்டி வேலை செய்யவில்லை"],
        "Telugu": ["బ్లడ్ బ్యాంక్ లో రక్తం అందుబాటులో లేదు", "ఓ-నెగటివ్ బ్లడ్ లేదు", "బ్లడ్ బ్యాంక్ ఫ్రిజ్ పనిచేయడం లేదు"],
        "Bengali": ["ব্লাড ব্যাংকে রক্ত নেই", "ও-নেগেটিভ রক্ত পাওয়া যাচ্ছে না", "ব্লাড ব্যাংকের ফ্রিজ কাজ করছে না"],
        "Gujarati": ["બ્લડ બેંકમાં લોહી ઉપલબ્ધ નથી", "ઓ-નેગેટિવ લોહી નથી", "બ્લડ બેંકનું ફ્રીજ કામ કરતું નથી"],
        "Kannada": ["ರಕ್ತ ನಿಧಿಯಲ್ಲಿ ರಕ್ತ ಲಭ್ಯವಿಲ್ಲ", "ಓ-ನೆಗೆಟಿವ್ ರಕ್ತವಿಲ್ಲ", "ರಕ್ತ ನಿಧಿಯ ಫ್ರಿಡ್ಜ್ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ"],
        "Malayalam": ["ബ്ലഡ് ബാങ്കിൽ രക്തം ലഭ്യമല്ല", "ഓ-നെഗറ്റീവ് രക്തമില്ല", "ബ്ലഡ് ബാങ്കിലെ ഫ്രിഡ്ജ് പ്രവർത്തിക്കുന്നില്ല"],
        "Punjabi": ["ਬਲੱਡ ਬੈਂਕ ਵਿੱਚ ਖੂਨ ਉਪਲਬਧ ਨਹੀਂ", "ਓ-ਨੈਗੇਟਿਵ ਖੂਨ ਨਹੀਂ ਹੈ", "ਬਲੱਡ ਬੈਂਕ ਦਾ ਫਰਿੱਜ ਕੰਮ ਨਹੀਂ ਕਰ ਰਿਹਾ"],
    },

    "Laboratory": {
        "English": ["lab equipment is not working", "lab reports are delayed by days", "lab technician not present", "wrong lab reports being given", "reagents have expired", "blood test not possible due to broken centrifuge", "no facility for basic tests"],
        "Hindi": ["लैब के उपकरण काम नहीं कर रहे", "लैब रिपोर्ट दिनों से देरी हो रही है", "लैब तकनीशियन मौजूद नहीं", "ग़लत लैब रिपोर्ट दी जा रही हैं", "रीएजेंट्स एक्सपायर हो चुके हैं", "सेंट्रीफ्यूज खराब होने से ब्लड टेस्ट नहीं हो रहा"],
        "Marathi": ["लॅब उपकरणे काम करत नाहीत", "लॅब रिपोर्ट दिवसांनी उशीरा येतात", "लॅब तंत्रज्ञ हजर नाही", "चुकीच्या रिपोर्ट दिल्या जात आहेत"],
        "Tamil": ["ஆய்வக கருவிகள் வேலை செய்யவில்லை", "ஆய்வக அறிக்கைகள் நாட்களாக தாமதமாகின்றன", "ஆய்வக தொழில்நுட்ப வல்லுநர் இல்லை"],
        "Telugu": ["ల్యాబ్ పరికరాలు పనిచేయడం లేదు", "ల్యాబ్ రిపోర్ట్‌లు రోజుల తరబడి ఆలస్యమవుతున్నాయి", "ల్యాబ్ టెక్నీషియన్ లేరు"],
        "Bengali": ["ল্যাবের যন্ত্রপাতি কাজ করছে না", "ল্যাব রিপোর্ট দিনের পর দিন দেরি হচ্ছে", "ল্যাব টেকনিশিয়ান নেই"],
        "Gujarati": ["લેબના સાધનો કામ નથી કરતા", "લેબ રિપોર્ટ દિવસોથી મોડા આવે છે", "લેબ ટેકનિશિયન હાજર નથી"],
        "Kannada": ["ಲ್ಯಾಬ್ ಉಪಕರಣಗಳು ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ", "ಲ್ಯಾಬ್ ವರದಿಗಳು ದಿನಗಳವರೆಗೆ ವಿಳಂಬವಾಗುತ್ತಿವೆ", "ಲ್ಯಾಬ್ ತಂತ್ರಜ್ಞರು ಹಾಜರಿಲ್ಲ"],
        "Malayalam": ["ലാബ് ഉപകരണങ്ങൾ പ്രവർത്തിക്കുന്നില്ല", "ലാബ് റിപ്പോർട്ടുകൾ ദിവസങ്ങളോളം വൈകുന്നു", "ലാബ് ടെക്നീഷ്യൻ ഹാജരില്ല"],
        "Punjabi": ["ਲੈਬ ਦੇ ਉਪਕਰਣ ਕੰਮ ਨਹੀਂ ਕਰ ਰਹੇ", "ਲੈਬ ਰਿਪੋਰਟਾਂ ਕਈ ਦਿਨਾਂ ਤੋਂ ਲੇਟ ਹਨ", "ਲੈਬ ਟੈਕਨੀਸ਼ੀਅਨ ਹਾਜ਼ਰ ਨਹੀਂ"],
    },

    "Radiology": {
        "English": ["X-ray machine is out of order", "ultrasound facility not available", "CT scan machine has been down", "no radiologist to read reports", "X-ray film shortage", "radiation safety norms not followed"],
        "Hindi": ["एक्स-रे मशीन खराब है", "अल्ट्रासाउंड सुविधा उपलब्ध नहीं", "सीटी स्कैन मशीन बंद पड़ी है", "रिपोर्ट पढ़ने के लिए रेडियोलॉजिस्ट नहीं", "एक्स-रे फ़िल्म की कमी"],
        "Tamil": ["எக்ஸ்-ரே இயந்திரம் செயலிழந்துள்ளது", "அல்ட்ராசவுண்ட் வசதி இல்லை", "சிடி ஸ்கேன் இயந்திரம் பழுதில் உள்ளது"],
        "Telugu": ["ఎక్స్-రే మెషీన్ పాడైంది", "అల్ట్రాసౌండ్ సదుపాయం అందుబాటులో లేదు", "సీటీ స్కాన్ మెషీన్ పనిచేయడం లేదు"],
        "Bengali": ["এক্স-রে মেশিন অচল", "আল্ট্রাসাউন্ড সুবিধা নেই", "সিটি স্ক্যান মেশিন বন্ধ"],
        "Gujarati": ["એક્સ-રે મશીન ખરાબ છે", "અલ્ટ્રાસાઉન્ડ સુવિધા ઉપલબ્ધ નથી", "સીટી સ્કેન મશીન બંધ છે"],
        "Kannada": ["ಎಕ್ಸ್-ರೇ ಯಂತ್ರ ಹಾಳಾಗಿದೆ", "ಅಲ್ಟ್ರಾಸೌಂಡ್ ಸೌಲಭ್ಯ ಲಭ್ಯವಿಲ್ಲ", "ಸಿಟಿ ಸ್ಕ್ಯಾನ್ ಯಂತ್ರ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ"],
        "Malayalam": ["എക്സ്-റേ മെഷീൻ കേടാണ്", "അൾട്രാസൗണ്ട് സൗകര്യം ലഭ്യമല്ല", "സിടി സ്കാൻ മെഷീൻ പ്രവർത്തിക്കുന്നില്ല"],
        "Punjabi": ["ਐਕਸ-ਰੇ ਮਸ਼ੀਨ ਖਰਾਬ ਹੈ", "ਅਲਟਰਾਸਾਊਂਡ ਦੀ ਸਹੂલਤ ਨਹੀਂ ਹੈ", "ਸੀਟੀ ਸਕੈਨ ਮਸ਼ੀਨ ਬੰਦ ਹੈ"],
    },

    "Pharmacy": {
        "English": ["pharmacy counter is always closed", "pharmacist gives wrong medicine", "pharmacy has no stock at all", "generic medicines not available only costly brands", "pharmacy timings are irregular", "medicine given without prescription check"],
        "Hindi": ["फार्मेसी काउंटर हमेशा बंद रहता है", "फार्मासिस्ट ग़लत दवा दे रहा है", "फार्मेसी में कुछ भी स्टॉक नहीं है", "जेनेरिक दवाएँ नहीं सिर्फ़ महँगी ब्रांड", "फार्मेसी का समय अनियमित है"],
        "Marathi": ["फार्मसी काउंटर नेहमी बंद असतो", "फार्मासिस्ट चुकीचे औषध देतो", "फार्मसीत काहीच स्टॉक नाही"],
        "Tamil": ["மருந்தகம் எப்போதும் மூடியே இருக்கிறது", "மருந்தாளுநர் தவறான மருந்து தருகிறார்", "மருந்தகத்தில் சரக்கே இல்லை"],
        "Telugu": ["ఫార్మసీ కౌంటర్ ఎప్పుడూ మూసే ఉంటుంది", "ఫార్మసిస్ట్ తప్పుడు మందు ఇస్తున్నారు", "ఫార్మసీలో స్టాక్ ఏమీ లేదు"],
        "Bengali": ["ফার্মেসি কাউন্টার সবসময় বন্ধ থাকে", "ফার্মাসিস্ট ভুল ওষুধ দিচ্ছে", "ফার্মেসিতে কিছুই স্টকে নেই"],
        "Gujarati": ["ફાર્મસી કાઉન્ટર હંમેશા બંધ રહે છે", "ફાર્માસિસ્ટ ખોટી દવા આપે છે", "ફાર્મસીમાં કોઈ સ્ટોક નથી"],
        "Kannada": ["ಫಾರ್ಮಸಿ ಕೌಂಟರ್ ಯಾವಾಗಲೂ ಮುಚ್ಚಿರುತ್ತದೆ", "ಫಾರ್ಮಾಸಿಸ್ಟ್ ತಪ್ಪು ಔಷಧ ನೀಡುತ್ತಾರೆ", "ಫಾರ್ಮಸಿಯಲ್ಲಿ ಸ್ಟಾಕ್ ಇಲ್ಲ"],
        "Malayalam": ["ഫാർമസി കൗണ്ടർ എപ്പോഴും അടച്ചിരിക്കും", "ഫാർമസിസ്റ്റ് തെറ്റായ മരുന്ന് നൽകുന്നു", "ഫാർമസിയിൽ സ്റ്റോക്ക് ഇല്ല"],
        "Punjabi": ["ਫਾਰਮੇਸੀ ਕਾਊਂਟਰ ਹਮੇਸ਼ਾ ਬੰਦ ਰਹਿੰਦਾ ਹੈ", "ਫਾਰਮਾਸਿਸਟ ਗਲਤ ਦਵਾਈ ਦਿੰਦਾ ਹੈ", "ਫਾਰਮੇਸੀ ਵਿੱਚ ਕੋਈ ਸਟਾਕ ਨਹੀਂ ਹੈ"],
    },

    "Operation Theatre": {
        "English": ["OT is not functioning", "OT not sterilized properly", "OT lights are not working", "anaesthesia machine is faulty", "no OT technician available", "surgical instruments are rusted", "OT AC is broken and it is very hot"],
        "Hindi": ["ओटी काम नहीं कर रहा", "ओटी ठीक से स्टेरलाइज़ नहीं किया गया", "ओटी की लाइटें काम नहीं कर रहीं", "एनेस्थीसिया मशीन खराब है", "ओटी तकनीशियन उपलब्ध नहीं", "सर्जिकल उपकरणों में जंग लगा है"],
        "Tamil": ["அறுவை சிகிச்சை அறை செயல்படவில்லை", "அறுவை சிகிச்சை அறை சரியாக கிருமி நீக்கம் செய்யப்படவில்லை", "அறுவை சிகிச்சை விளக்குகள் வேலை செய்யவில்லை"],
        "Telugu": ["ఆపరేషన్ థియేటర్ పనిచేయడం లేదు", "ఓటీ సరిగ్గా స్టెరిలైజ్ కాలేదు", "ఓటీ లైట్లు పనిచేయడం లేదు"],
        "Bengali": ["ওটি কাজ করছে না", "ওটি ঠিকমতো জীবাণুমুক্ত করা হয়নি", "ওটির আলো কাজ করছে না"],
        "Gujarati": ["ઓટી કામ નથી કરતું", "ઓટી યોગ્ય રીતે સાફ નથી", "ઓટીની લાઈટો કામ નથી કરતી"],
        "Kannada": ["ಓಟಿ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ", "ಓಟಿ ಸರಿಯಾಗಿ ಸ್ವಚ್ಛಗೊಳಿಸಿಲ್ಲ", "ಓಟಿ ಲೈಟ್‌ಗಳು ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ"],
        "Malayalam": ["ഓപ്പറേഷൻ തിയേറ്റർ പ്രവർത്തിക്കുന്നില്ല", "ഒടി ശരിയായി വൃത്തിയാക്കിയിട്ടില്ല", "ഒടി ലൈറ്റുകൾ പ്രവർത്തിക്കുന്നില്ല"],
        "Punjabi": ["ਓਟੀ ਕੰਮ ਨਹੀਂ ਕਰ ਰਿਹਾ", "ਓਟੀ ਠੀਕ ਤਰ੍ਹਾਂ ਸਾਫ਼ ਨਹੀਂ", "ਓਟੀ ਦੀਆਂ ਲਾਈਟਾਂ ਕੰਮ ਨਹੀਂ ਕਰ ਰਹੀਆਂ"],
    },

    "Emergency Services": {
        "English": ["no doctor available in emergency", "emergency ward has no beds", "oxygen supply cut off in emergency", "crash cart not available", "emergency drugs have expired", "triage system not being followed", "emergency patients kept waiting for hours"],
        "Hindi": ["इमरजेंसी में कोई डॉक्टर उपलब्ध नहीं", "इमरजेंसी वार्ड में बेड नहीं हैं", "इमरजेंसी में ऑक्सीजन सप्लाई बंद", "क्रैश कार्ट उपलब्ध नहीं", "इमरजेंसी दवाइयाँ एक्सपायर हो चुकी हैं", "ट्रायज सिस्टम का पालन नहीं हो रहा"],
        "Tamil": ["அவசர சிகிச்சையில் மருத்துவர் இல்லை", "அவசர வார்டில் படுக்கைகள் இல்லை", "அவசரப் பிரிவில் ஆக்ஸிஜன் வழங்கல் நிறுத்தப்பட்டது"],
        "Telugu": ["ఎమర్జెన్సీలో డాక్టర్ అందుబాటులో లేరు", "ఎమర్జెన్సీ వార్డ్ లో బెడ్స్ లేవు", "ఎమర్జెన్సీలో ఆక్సిజన్ సరఫరా ఆగిపోయింది"],
        "Bengali": ["ইমার্জেন্সিতে কোনো ডাক্তার নেই", "ইমার্জেন্সি ওয়ার্ডে বেড নেই", "ইমার্জেন্সিতে অক্সিজেন সাপ্লাই বন্ধ"],
        "Gujarati": ["ઇમરજન્સીમાં કોઈ ડૉક્ટર ઉપલબ્ધ નથી", "ઇમરજન્સી વોર્ડમાં બેડ નથી", "ઇમરજન્સીમાં ઓક્સિજન સપ્લાય બંધ છે"],
        "Kannada": ["ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ವೈದ್ಯರಿಲ್ಲ", "ತುರ್ತು ವಾರ್ಡ್‌ನಲ್ಲಿ ಹಾಸಿಗೆಗಳಿಲ್ಲ", "ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಆಮ್ಲಜನಕ ಪೂರೈಕೆ ಸ್ಥಗಿತಗೊಂಡಿದೆ"],
        "Malayalam": ["എമർജൻസിയിൽ ഡോക്ടർ ഇല്ല", "എമർജൻസി വാർഡിൽ കിടക്കകളില്ല", "എമർജൻസിയിൽ ഓക്സിജൻ വിതരണം നിലച്ചു"],
        "Punjabi": ["ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਕੋਈ ਡਾਕਟਰ ਨਹੀਂ", "ਐਮਰਜੈਂਸੀ ਵਾਰਡ ਵਿੱਚ ਬੈੱਡ ਨਹੀਂ ਹਨ", "ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਆਕਸੀਜਨ ਦੀ ਸਪਲਾਈ ਬੰਦ ਹੈ"],
    },

    "Billing": {
        "English": ["overcharged for basic services", "bill includes services not provided", "no proper receipt given", "Ayushman Bharat card not accepted", "hidden charges in the bill", "billing counter staff demanding extra payment", "different rates for same service"],
        "Hindi": ["बुनियादी सेवाओं के लिए ज़्यादा पैसे लिए गए", "बिल में ऐसी सेवाएँ शामिल हैं जो दी ही नहीं गईं", "कोई उचित रसीद नहीं दी गई", "आयुष्मान भारत कार्ड स्वीकार नहीं किया जा रहा", "बिल में छुपे हुए चार्ज हैं"],
        "Marathi": ["मूलभूत सेवांसाठी जास्त पैसे आकारले", "बिलात न दिलेल्या सेवांचा समावेश", "योग्य पावती दिली नाही", "आयुष्मान भारत कार्ड स्वीकारले जात नाही"],
        "Tamil": ["அடிப்படை சேவைகளுக்கு அதிகமாக வசூலிக்கப்பட்டது", "வழங்கப்படாத சேவைகள் பில்லில் சேர்க்கப்பட்டுள்ளன", "முறையான ரசீது தரப்படவில்லை", "ஆயுஷ்மான் பாரத் அட்டை ஏற்றுக்கொள்ளப்படவில்லை"],
        "Telugu": ["ప్రాథమిక సేవలకు ఎక్కువ ఛార్జ్ చేయబడింది", "అందించని సేవలు బిల్లులో ఉన్నాయి", "సరైన రసీదు ఇవ్వలేదు", "ఆయుష్మాన్ భారత్ కార్డు అంగీకరించడం లేదు"],
        "Bengali": ["মৌলিক সেবার জন্য অতিরিক্ত টাকা নেওয়া হয়েছে", "যে সেবা দেওয়া হয়নি তা বিলে রয়েছে", "সঠিক রসিদ দেওয়া হয়নি", "আয়ুষ্মান ভারত কার্ড গ্রহণ করা হচ্ছে না"],
        "Gujarati": ["મૂળભૂત સેવાઓ માટે વધુ પૈસા લેવાયા", "બિલમાં ન અપાયેલી સેવાઓ સામેલ છે", "યોગ્ય રસીદ અપાઈ નથી"],
        "Kannada": ["ಮೂಲ ಸೇವೆಗಳಿಗೆ ಹೆಚ್ಚು ಹಣ ವಿಧಿಸಲಾಗಿದೆ", "ನೀಡದ ಸೇವೆಗಳನ್ನು ಬಿಲ್‌ನಲ್ಲಿ ಸೇರಿಸಲಾಗಿದೆ", "ಸರಿಯಾದ ರಶೀದಿ ನೀಡಿಲ್ಲ"],
        "Malayalam": ["അടിസ്ഥാന സേവനങ്ങൾക്ക് കൂടുതൽ പണം ഈടാക്കി", "നൽകാത്ത സേവനങ്ങൾ ബില്ലിൽ ഉൾപ്പെടുത്തി", "കൃത്യമായ രസീത് നൽകിയില്ല"],
        "Punjabi": ["ਬੁਨਿਆਦੀ ਸੇਵਾਵਾਂ ਲਈ ਵੱਧ ਪੈਸੇ ਲਏ ਗਏ", "ਬਿੱਲ ਵਿੱਚ ਨਾ ਦਿੱਤੀਆਂ ਸੇਵਾਵਾਂ ਸ਼ਾਮਲ ਹਨ", "ਸਹੀ ਰਸੀਦ ਨਹੀਂ ਦਿੱਤੀ ਗਈ"],
    },

    "Government Schemes": {
        "English": ["Ayushman Bharat card rejected without reason", "PMJAY benefits denied to eligible patient", "Janani Suraksha Yojana payment not received", "government scheme benefits not available", "staff unaware of government health schemes", "patients turned away despite valid scheme cards"],
        "Hindi": ["आयुष्मान भारत कार्ड बिना कारण रिजेक्ट किया", "PMJAY का लाभ पात्र मरीज़ को नहीं दिया गया", "जननी सुरक्षा योजना का भुगतान नहीं मिला", "सरकारी योजनाओं का लाभ नहीं मिल रहा", "कर्मचारी सरकारी योजनाओं से अनजान हैं"],
        "Marathi": ["आयुष्मान भारत कार्ड विनाकारण नाकारले", "PMJAY चा लाभ पात्र रुग्णाला नाकारला", "जननी सुरक्षा योजनेचे पैसे मिळाले नाहीत"],
        "Tamil": ["ஆயுஷ்மான் பாரத் அட்டை காரணமின்றி நிராகரிக்கப்பட்டது", "PMJAY பலன்கள் தகுதியான நோயாளிக்கு மறுக்கப்பட்டது", "ஜனனி சுரக்ஷா யோஜனா பணம் கிடைக்கவில்லை"],
        "Telugu": ["ఆయుష్మాన్ భారత్ కార్డ్ కారణం లేకుండా తిరస్కరించబడింది", "PMJAY ప్రయోజనాలు అర్హత ఉన్న రోగికి తిరస్కరించబడ్డాయి"],
        "Bengali": ["আয়ুষ্মান ভারত কার্ড বিনা কারণে প্রত্যাখ্যান হয়েছে", "PMJAY সুবিধা যোগ্য রোগীকে দেওয়া হয়নি"],
        "Gujarati": ["આયુષ્માન ભારત કાર્ડ કારણ વગર નકારવામાં આવ્યું", "PMJAY લાભ લાયક દર્દીને ન મળ્યો"],
        "Kannada": ["ಕಾರಣವಿಲ್ಲದೆ ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಕಾರ್ಡ್ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ", "ಅರ್ಹ ರೋಗಿಗೆ ಪಿಎಂಜೆಎವೈ ಪ್ರಯೋಜನಗಳನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ"],
        "Malayalam": ["കാരണമില്ലാതെ ആയുഷ്മാൻ ഭാരത് കാർഡ് നിരസിച്ചു", "അർഹനായ രോഗിക്ക് പിഎംജെഎവൈ ആനുകൂല്യങ്ങൾ നിഷേധിച്ചു"],
        "Punjabi": ["ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ ਕਾਰਡ ਬਿਨਾਂ ਕਾਰਨ ਰੱਦ ਕੀਤਾ ਗਿਆ", "ਯੋਗ ਮਰੀਜ਼ ਨੂੰ ਪੀਐਮਜੇਏਵਾਈ ਲਾਭ ਨਹੀਂ ਦਿੱਤਾ ਗਿਆ"],
    },

    "Appointment": {
        "English": ["appointment system not working", "no online appointment facility", "patients waiting for hours without appointment", "appointment given for wrong department", "doctor not available on appointment day", "token system is broken"],
        "Hindi": ["अपॉइंटमेंट सिस्टम काम नहीं कर रहा", "ऑनलाइन अपॉइंटमेंट की सुविधा नहीं", "मरीज़ बिना अपॉइंटमेंट घंटों इंतज़ार कर रहे", "ग़लत विभाग का अपॉइंटमेंट दिया गया", "अपॉइंटमेंट वाले दिन डॉक्टर उपलब्ध नहीं"],
        "Tamil": ["நேர நிர்ணய அமைப்பு வேலை செய்யவில்லை", "ஆன்லைன் நேர நிர்ணய வசதி இல்லை", "நோயாளிகள் மணிக்கணக்கில் காத்திருக்கிறார்கள்"],
        "Telugu": ["అపాయింట్మెంట్ సిస్టమ్ పనిచేయడం లేదు", "ఆన్లైన్ అపాయింట్మెంట్ సౌకర్యం లేదు", "రోగులు గంటల తరబడి ఎదురు చూస్తున్నారు"],
        "Bengali": ["অ্যাপয়েন্টমেন্ট সিস্টেম কাজ করছে না", "অনলাইন অ্যাপয়েন্টমেন্ট সুবিধা নেই", "রোগীরা ঘণ্টার পর ঘণ্টা অপেক্ষা করছেন"],
        "Gujarati": ["એપોઇન્ટમેન્ટ સિસ્ટમ કામ નથી કરતી", "ઓનલાઈન એપોઇન્ટમેન્ટ સુવિધા નથી"],
        "Kannada": ["ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಸಿಸ್ಟಮ್ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ", "ಆನ್‌ಲೈನ್ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಸೌಲಭ್ಯವಿಲ್ಲ"],
        "Malayalam": ["അപ്പോയിന്റ്മെന്റ് സിസ്റ്റം പ്രവർത്തിക്കുന്നില്ല", "ഓൺലൈൻ അപ്പോയിന്റ്മെന്റ് സൗകര്യമില്ല"],
        "Punjabi": ["ਅਪਾਇੰਟਮੈਂਟ ਸਿਸਟਮ ਕੰਮ ਨਹੀਂ ਕਰ ਰਿਹਾ", "ਆਨਲਾਈਨ ਅਪਾਇੰਟਮੈਂਟ ਦੀ ਸਹੂਲਤ ਨਹੀਂ ਹੈ"],
    },

    "General Inquiry": {
        "English": ["no helpdesk available for patients", "staff not responding to queries", "no information board anywhere", "hospital website has wrong information", "phone numbers given are not reachable", "nobody answers the hospital helpline"],
        "Hindi": ["मरीज़ों के लिए कोई हेल्पडेस्क नहीं", "कर्मचारी सवालों का जवाब नहीं दे रहे", "कहीं भी सूचना बोर्ड नहीं है", "अस्पताल की वेबसाइट पर ग़लत जानकारी है", "दिए गए फ़ोन नंबर पर कोई नहीं उठाता"],
        "Tamil": ["நோயாளிகளுக்கு உதவி மையம் இல்லை", "ஊழியர்கள் கேள்விகளுக்கு பதிலளிக்கவில்லை", "எங்கும் தகவல் பலகை இல்லை"],
        "Telugu": ["రోగులకు హెల్ప్ డెస్క్ లేదు", "సిబ్బంది ప్రశ్నలకు సమాధానం ఇవ్వడం లేదు", "ఎక్కడా సమాచార బోర్డు లేదు"],
        "Bengali": ["রোগীদের জন্য কোনো হেল্পডেস্ক নেই", "কর্মীরা প্রশ্নের উত্তর দিচ্ছেন না", "কোথাও তথ্য বোর্ড নেই"],
        "Gujarati": ["દર્દીઓ માટે કોઈ હેલ્પડેસ્ક નથી", "કર્મચારીઓ પ્રશ્નોના જવાબ નથી આપતા"],
        "Kannada": ["ರೋಗಿಗಳಿಗೆ ಯಾವುದೇ ಸಹಾಯವಾಣಿ ಲಭ್ಯವಿಲ್ಲ", "ಸಿಬ್ಬಂದಿ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸುತ್ತಿಲ್ಲ"],
        "Malayalam": ["രോഗികൾക്ക് ഹെൽപ്പ് ഡെസ്ക് ലഭ്യമല്ല", "ജീവനക്കാർ ചോദ്യങ്ങൾക്ക് മറുപടി നൽകുന്നില്ല"],
        "Punjabi": ["ਮਰੀਜ਼ਾਂ ਲਈ ਕੋਈ ਹੈਲਪਡੈਸਕ ਨਹੀਂ ਹੈ", "ਸਟਾਫ ਸਵਾਲਾਂ ਦਾ ਜਵਾਬ ਨਹੀਂ ਦੇ ਰਿਹਾ"],
    },

    "Medical Negligence": {
        "English": ["wrong medicine given to patient", "surgical instrument left inside patient", "wrong leg operated upon", "patient allergy ignored and adverse drug given", "critical patient not monitored", "blood transfusion of wrong blood group", "newborn given to wrong mother"],
        "Hindi": ["मरीज़ को ग़लत दवा दी गई", "मरीज़ के अंदर सर्जिकल उपकरण छोड़ दिया", "ग़लत पैर का ऑपरेशन किया", "मरीज़ की एलर्जी को अनदेखा कर दवा दी", "गंभीर मरीज़ की निगरानी नहीं की गई", "ग़लत ब्लड ग्रुप का ट्रांसफ़्यूज़न किया"],
        "Tamil": ["நோயாளிக்கு தவறான மருந்து தரப்பட்டது", "அறுவை சிகிச்சை கருவி உடலுக்குள் விடப்பட்டது", "தவறான காலில் அறுவை சிகிச்சை செய்யப்பட்டது"],
        "Telugu": ["రోగికి తప్పుడు మందు ఇచ్చారు", "రోగి లోపల సర్జికల్ పరికరం వదిలేశారు", "తప్పు కాలు ఆపరేట్ చేశారు"],
        "Bengali": ["রোগীকে ভুল ওষুধ দেওয়া হয়েছে", "অপারেশনে সার্জিক্যাল যন্ত্র রোগীর ভিতরে রেখে দেওয়া হয়েছে", "ভুল পায়ে অপারেশন করা হয়েছে"],
        "Gujarati": ["દર્દીને ખોટી દવા અપાઈ", "દર્દીની અંદર સર્જિકલ સાધન છોડી દીધું", "ખોટા પગનું ઓપરેશન થયું"],
        "Kannada": ["ರೋಗಿಗೆ ತಪ್ಪು ಔಷಧ ನೀಡಲಾಗಿದೆ", "ರೋಗಿಯೊಳಗೆ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಉಪಕರಣವನ್ನು ಬಿಡಲಾಗಿದೆ", "ತಪ್ಪು ಕಾಲಿಗೆ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮಾಡಲಾಗಿದೆ"],
        "Malayalam": ["രോഗിക്ക് തെറ്റായ മരുന്ന് നൽകി", "രോഗിയുടെ ഉള്ളിൽ സർജിക്കൽ ഉപകരണം ഉപേക്ഷിച്ചു", "തെറ്റായ കാലിൽ ഓപ്പറേഷൻ ചെയ്തു"],
        "Punjabi": ["ਮਰੀਜ਼ ਨੂੰ ਗਲਤ ਦਵਾਈ ਦਿੱਤੀ ਗਈ", "ਮਰੀਜ਼ ਦੇ ਅੰਦਰ ਸਰਜੀਕਲ ਉਪਕਰਣ ਛੱਡ ਦਿੱਤਾ ਗਿਆ", "ਗਲਤ ਲੱਤ ਦਾ ਆਪ੍ਰੇਸ਼ਨ ਕੀਤਾ ਗਿਆ"],
    },

    "Patient Safety": {
        "English": ["patient fell from bed due to broken railing", "no fire safety equipment", "infection spreading in ward", "sharp disposal box overflowing", "no hand sanitizer available", "isolation ward not maintained", "hospital-acquired infection reported"],
        "Hindi": ["टूटी रेलिंग से मरीज़ बिस्तर से गिर गया", "अग्नि सुरक्षा उपकरण नहीं हैं", "वार्ड में संक्रमण फैल रहा है", "शार्प डिस्पोज़ल बॉक्स ओवरफ़्लो हो रहा", "हैंड सैनिटाइज़र उपलब्ध नहीं", "आइसोलेशन वार्ड का रखरखाव नहीं"],
        "Tamil": ["உடைந்த கைப்பிடியால் நோயாளி படுக்கையில் இருந்து விழுந்தார்", "தீ பாதுகாப்பு கருவிகள் இல்லை", "வார்டில் தொற்று பரவுகிறது"],
        "Telugu": ["విరిగిన రెయిలింగ్ వల్ల రోగి బెడ్ నుండి పడిపోయారు", "అగ్ని భద్రతా పరికరాలు లేవు", "వార్డ్ లో ఇన్ఫెక్షన్ వ్యాపిస్తోంది"],
        "Bengali": ["ভাঙা রেলিং থেকে রোগী বিছানা থেকে পড়ে গেছেন", "অগ্নি নিরাপত্তা সরঞ্জাম নেই", "ওয়ার্ডে সংক্রমণ ছড়াচ্ছে"],
        "Gujarati": ["તૂટેલી રેલિંગથી દર્દી પથારીમાંથી પડી ગયો", "આગ સલામતીના સાધનો નથી", "વોર્ડમાં ચેપ ફેલાઈ રહ્યો છે"],
        "Kannada": ["ಮುರಿದ ರೇಲಿಂಗ್‌ನಿಂದ ರೋಗಿ ಹಾಸಿಗೆಯಿಂದ ಬಿದ್ದಿದ್ದಾರೆ", "ಅಗ್ನಿಶಾಮಕ ಸುರಕ್ಷತಾ ಉಪಕರಣಗಳಿಲ್ಲ", "ವಾರ್ಡ್‌ನಲ್ಲಿ ಸೋಂಕು ಹರಡುತ್ತಿದೆ"],
        "Malayalam": ["പൊട്ടിയ കൈവരി കാരണം രോഗി കട്ടിലിൽ നിന്ന് വീണു", "അഗ്നിസുരക്ഷാ ഉപകരണങ്ങളില്ല", "വാർഡിൽ അണുബാധ പടരുന്നു"],
        "Punjabi": ["ਟੁੱਟੀ ਰੇਲਿੰਗ ਕਾਰਨ ਮਰੀਜ਼ ਬਿਸਤਰੇ ਤੋਂ ਡਿੱਗ ਗਿਆ", "ਅੱਗ ਬੁਝਾਉਣ ਵਾਲੇ ਉਪਕਰਣ ਨਹੀਂ ਹਨ", "ਵਾਰਡ ਵਿੱਚ ਇਨਫੈਕਸ਼ਨ ਫੈਲ ਰਹੀ ਹੈ"],
    },

    "Security": {
        "English": ["theft reported in hospital ward", "no CCTV cameras installed", "security guard not present at night", "stray animals entering hospital premises", "unauthorized persons roaming freely", "patient belongings stolen"],
        "Hindi": ["अस्पताल वार्ड में चोरी की शिकायत", "सीसीटीवी कैमरे नहीं लगे हैं", "रात में सिक्योरिटी गार्ड मौजूद नहीं", "आवारा जानवर अस्पताल में घुस रहे हैं", "अनधिकृत लोग स्वतंत्र रूप से घूम रहे", "मरीज़ का सामान चोरी हो गया"],
        "Tamil": ["மருத்துவமனை வார்டில் திருட்டு புகார்", "சிசிடிவி கேமரா பொருத்தப்படவில்லை", "இரவில் பாதுகாவலர் இல்லை"],
        "Telugu": ["ఆస్పత్రి వార్డ్ లో దొంగతనం జరిగింది", "సీసీటీవీ కెమెరాలు లేవు", "రాత్రి సెక్యూరిటీ గార్డ్ లేరు"],
        "Bengali": ["হাসপাতাল ওয়ার্ডে চুরির অভিযোগ", "সিসিটিভি ক্যামেরা লাগানো নেই", "রাতে সিকিউরিটি গার্ড নেই"],
        "Gujarati": ["હોસ્પિટલ વોર્ડમાં ચોરીની ફરિયાદ", "સીસીટીવી કેમેરા લાગેલા નથી", "રાત્રે સિક્યોરિટી ગાર્ડ નથી"],
        "Kannada": ["ಆಸ್ಪತ್ರೆ ವಾರ್ಡ್‌ನಲ್ಲಿ ಕಳ್ಳತನ ವರದಿಯಾಗಿದೆ", "ಸಿಸಿಟಿವಿ ಕ್ಯಾಮೆರಾಗಳನ್ನು ಅಳವಡಿಸಿಲ್ಲ", "ರಾತ್ರಿ ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ ಇಲ್ಲ"],
        "Malayalam": ["ആശുപത്രി വാർഡിൽ മോഷണം റിപ്പോർട്ട് ചെയ്തു", "സിസിടിവി ക്യാമറകൾ സ്ഥാപിച്ചിട്ടില്ല", "രാത്രിയിൽ സെക്യൂരിറ്റി ഗാർഡ് ഇല്ല"],
        "Punjabi": ["ਹਸਪਤਾਲ ਵਾਰਡ ਵਿੱਚ ਚੋਰੀ ਦੀ ਰਿਪੋਰਟ", "ਸੀਸੀਟੀਵੀ ਕੈਮਰੇ ਨਹੀਂ ਲੱਗੇ", "ਰਾਤ ਨੂੰ ਸਿਕਿਓਰਿਟੀ ਗਾਰਡ ਨਹੀਂ ਹੈ"],
    },

    "Sanitation": {
        "English": ["open defecation near hospital compound", "sewage overflowing on hospital road", "stagnant water breeding mosquitoes", "no dustbins placed anywhere", "food waste dumped near patient ward", "foul smell from blocked sewer"],
        "Hindi": ["अस्पताल परिसर के पास खुले में शौच", "अस्पताल की सड़क पर सीवर ओवरफ़्लो", "रुके हुए पानी में मच्छर पैदा हो रहे", "कहीं भी डस्टबिन नहीं रखे गए", "मरीज़ वार्ड के पास खाने का कचरा फेंका जा रहा"],
        "Tamil": ["மருத்துவமனை வளாகத்தில் திறந்தவெளி கழிப்பிடம்", "மருத்துவமனை சாலையில் கழிவுநீர் வழிகிறது", "தேங்கிய நீரில் கொசுக்கள் உற்பத்தியாகின்றன"],
        "Telugu": ["ఆస్పత్రి ప్రాంగణంలో బహిరంగ మలవిసర్జన", "ఆస్పత్రి రోడ్డుపై మురుగు నీరు పొంగుతోంది", "నిల్వ నీటిలో దోమలు పెరుగుతున్నాయి"],
        "Bengali": ["হাসপাতাল প্রাঙ্গণে খোলা মলত্যাগ", "হাসপালের রাস্তায় নর্দমা উপচে পড়ছে", "জমা জলে মশা বাড়ছে"],
        "Gujarati": ["હોસ્પિટલ કમ્પાઉન્ડ પાસે ખુલ્લામાં શૌચ", "હોસ્પિટલના રસ્તા પર ગટર ઉભરાઈ રહી છે", "બંધિયાર પાણીમાં મચ્છર પેદા થઈ રહ્યા છે"],
        "Kannada": ["ಆಸ್ಪತ್ರೆ ಆವರಣದ ಬಳಿ ಬಯಲು ಶೌಚ", "ಆಸ್ಪತ್ರೆ ರಸ್ತೆಯಲ್ಲಿ ಚರಂಡಿ ಉಕ್ಕಿ ಹರಿಯುತ್ತಿದೆ", "ನಿಂತ ನೀರಿನಿಂದ ಸೊಳ್ಳೆಗಳು ಉತ್ಪತ್ತಿಯಾಗುತ್ತಿವೆ"],
        "Malayalam": ["ആശുപത്രി കോമ്പൗണ്ടിന് സമീപം തുറസ്സായ സ്ഥലത്ത് മലവിസർജ്ജനം", "ആശുപത്രി റോഡിൽ അഴുക്കുചാൽ കവിഞ്ഞൊഴുകുന്നു", "കെട്ടിക്കിടക്കുന്ന വെള്ളത്തിൽ കൊതുകുകൾ പെരുകുന്നു"],
        "Punjabi": ["ਹਸਪਤਾਲ ਦੇ ਅਹਾਤੇ ਨੇੜੇ ਖੁੱਲ੍ਹੇ ਵਿੱਚ ਸ਼ੌਚ", "ਹਸਪਤਾਲ ਦੀ ਸੜਕ 'ਤੇ ਸੀਵਰੇਜ ਓਵਰਫਲੋ ਹੋ ਰਿਹਾ ਹੈ", "ਖੜ੍ਹੇ ਪਾਣੀ ਵਿੱਚ ਮੱਛਰ ਪੈਦਾ ਹੋ ਰਹੇ ਹਨ"],
    },

    "IT Systems": {
        "English": ["hospital management software is down", "patient records system not working", "internet not available for telemedicine", "computer at registration crashed", "digital health records inaccessible", "e-Sanjeevani portal not functioning"],
        "Hindi": ["हॉस्पिटल मैनेजमेंट सॉफ़्टवेयर डाउन है", "मरीज़ रिकॉर्ड सिस्टम काम नहीं कर रहा", "टेलीमेडिसिन के लिए इंटरनेट उपलब्ध नहीं", "रजिस्ट्रेशन का कंप्यूटर क्रैश हो गया", "डिजिटल हेल्थ रिकॉर्ड एक्सेस नहीं हो रहे"],
        "Tamil": ["மருத்துவமனை மேலாண்மை மென்பொருள் செயல்படவில்லை", "நோயாளி பதிவு அமைப்பு வேலை செய்யவில்லை", "தொலை மருத்துவத்திற்கு இணையம் இல்லை"],
        "Telugu": ["హాస్పిటల్ మేనేజ్మెంట్ సాఫ్ట్వేర్ డౌన్ అయింది", "పేషెంట్ రికార్డ్స్ సిస్టమ్ పనిచేయడం లేదు", "టెలిమెడిసిన్ కోసం ఇంటర్నెట్ లేదు"],
        "Bengali": ["হাসপাতাল ম্যানেজমেন্ট সফটওয়্যার কাজ করছে না", "রোগীর রেকর্ড সিস্টেম বন্ধ", "টেলিমেডিসিনের জন্য ইন্টারনেট নেই"],
        "Gujarati": ["હોસ્પિટલ મેનેજમેન્ટ સોફ્ટવેર ડાઉન છે", "દર્દીના રેકોર્ડ સિસ્ટમ કામ નથી કરી રહી", "ટેલિમેડિસિન માટે ઈન્ટરનેટ નથી"],
        "Kannada": ["ಆಸ್ಪತ್ರೆ ನಿರ್ವಹಣಾ ಸಾಫ್ಟ್‌ವೇರ್ ಡೌನ್ ಆಗಿದೆ", "ರೋಗಿಗಳ ದಾಖಲೆ ವ್ಯವಸ್ಥೆ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ", "ಟೆಲಿಮೆಡಿಸಿನ್‌ಗೆ ಇಂಟರ್ನೆಟ್ ಲಭ್ಯವಿಲ್ಲ"],
        "Malayalam": ["ആശുപത്രി മാനേജ്മെന്റ് സോഫ്റ്റ്വെയർ പ്രവർത്തിക്കുന്നില്ല", "രോഗികളുടെ റെക്കോർഡ് സിസ്റ്റം പ്രവർത്തിക്കുന്നില്ല", "ടെലിമെഡിസിൻ ഇന്റർനെറ്റ് ലഭ്യമല്ല"],
        "Punjabi": ["ਹਸਪਤਾਲ ਮੈਨੇਜਮੈਂਟ ਸਾਫਟਵੇਅਰ ਡਾਊਨ ਹੈ", "ਮਰੀਜ਼ ਦਾ ਰਿਕਾਰਡ ਸਿਸਟਮ ਕੰਮ ਨਹੀਂ ਕਰ ਰਿਹਾ", "ਟੈਲੀਮੈਡੀਸਨ ਲਈ ਇੰਟਰਨੈਟ ਨਹੀਂ ਹੈ"],
    },

    "Power Backup": {
        "English": ["generator did not start during power cut", "UPS failed and ventilators stopped", "inverter battery is dead", "power backup only for admin block not wards", "generator fuel finished and not refilled", "no power backup for ICU"],
        "Hindi": ["बिजली जाने पर जनरेटर चालू नहीं हुआ", "यूपीएस फ़ेल हो गया और वेंटिलेटर रुक गए", "इन्वर्टर की बैटरी ख़त्म है", "पावर बैकअप सिर्फ़ एडमिन ब्लॉक के लिए वार्ड के लिए नहीं", "जनरेटर का फ्यूल ख़त्म हो गया"],
        "Tamil": ["மின்தடை நேரத்தில் ஜெனரேட்டர் இயங்கவில்லை", "UPS செயலிழந்து வென்டிலேட்டர்கள் நின்றன", "இன்வெர்டர் பேட்டரி தீர்ந்துவிட்டது"],
        "Telugu": ["విద్యుత్ పోయినప్పుడు జనరేటర్ స్టార్ట్ కాలేదు", "UPS ఫెయిల్ అయి వెంటిలేటర్లు ఆగిపోయాయి", "ఇన్వర్టర్ బ్యాటరీ అయిపోయింది"],
        "Bengali": ["বিদ্যুৎ যাওয়ার সময় জেনারেটর চালু হয়নি", "ইউপিএস ফেইল হয়ে ভেন্টিলেটর বন্ধ হয়ে গেছে", "ইনভার্টার ব্যাটারি শেষ"],
        "Gujarati": ["વીજળી જતાં જનરેટર ચાલુ ન થયું", "યુપીએસ ફેલ થતાં વેન્ટિલેટર બંધ થઈ ગયા", "ઇન્વર્ટરની બેટરી પૂરી થઈ ગઈ છે"],
        "Kannada": ["ವಿದ್ಯುತ್ ಕಡಿತದ ಸಮಯದಲ್ಲಿ ಜನರೇಟರ್ ಸ್ಟಾರ್ಟ್ ಆಗಲಿಲ್ಲ", "ಯುಪಿಎಸ್ ವಿಫಲವಾಗಿ ವೆಂಟಿಲೇಟರ್‌ಗಳು ನಿಂತವು", "ಇನ್ವರ್ಟರ್ ಬ್ಯಾಟರಿ ಡೆಡ್ ಆಗಿದೆ"],
        "Malayalam": ["കറണ്ട് പോയപ്പോൾ ജനറേറ്റർ സ്റ്റാർട്ട് ആയില്ല", "യുപിഎസ് പരാജയപ്പെട്ട് വെന്റിലേറ്ററുകൾ നിന്നു", "ഇൻവെർട്ടർ ബാറ്ററി തീർന്നു"],
        "Punjabi": ["ਬਿਜਲੀ ਜਾਣ 'ਤੇ ਜਨਰੇਟਰ ਸ਼ੁਰੂ ਨਹੀਂ ਹੋਇਆ", "ਯੂਪੀਐਸ ਫੇਲ੍ਹ ਹੋ ਗਿਆ ਅਤੇ ਵੈਂਟੀਲੇਟਰ ਬੰਦ ਹੋ ਗਏ", "ਇਨਵਰਟਰ ਦੀ ਬੈਟਰੀ ਖਤਮ ਹੋ ਗਈ ਹੈ"],
    },

    "Queue Management": {
        "English": ["no token system at OPD", "patients waiting in sun for hours", "queue jumpers not controlled", "VIP patients given preference over common people", "no seating arrangement in waiting area", "elderly patients forced to stand for hours"],
        "Hindi": ["ओपीडी में टोकन सिस्टम नहीं है", "मरीज़ घंटों धूप में खड़े हैं", "लाइन तोड़ने वालों पर कोई नियंत्रण नहीं", "वीआईपी मरीज़ों को आम लोगों पर तरजीह दी जाती है", "प्रतीक्षा क्षेत्र में बैठने की व्यवस्था नहीं"],
        "Tamil": ["OPD-யில் டோக்கன் அமைப்பு இல்லை", "நோயாளிகள் மணிக்கணக்கில் வெயிலில் காத்திருக்கிறார்கள்", "வரிசையை மீறுபவர்கள் கட்டுப்படுத்தப்படவில்லை"],
        "Telugu": ["OPD లో టోకెన్ సిస్టమ్ లేదు", "రోగులు గంటల తరబడి ఎండలో నిలబడి ఉన్నారు", "క్యూ జంప్ చేసేవారిని అదుపు చేయడం లేదు"],
        "Bengali": ["OPD-তে টোকেন সিস্টেম নেই", "রোগীরা ঘণ্টার পর ঘণ্টা রোদে দাঁড়িয়ে আছেন", "লাইন ভাঙা নিয়ন্ত্রণ করা হচ্ছে না"],
        "Gujarati": ["ઓપીડીમાં ટોકન સિસ્ટમ નથી", "દર્દીઓ કલાકો સુધી તડકામાં ઉભા છે", "લાઇન તોડનારાઓ પર કોઈ નિયંત્રણ નથી"],
        "Kannada": ["ಒಪಿಡಿಯಲ್ಲಿ ಟೋಕನ್ ವ್ಯವಸ್ಥೆ ಇಲ್ಲ", "ರೋಗಿಗಳು ಗಂಟೆಗಟ್ಟಲೆ ಬಿಸಿಲಿನಲ್ಲಿ ಕಾಯುತ್ತಿದ್ದಾರೆ", "ಸರತಿಯನ್ನು ಮೀರುವವರನ್ನು ನಿಯಂತ್ರಿಸುತ್ತಿಲ್ಲ"],
        "Malayalam": ["ഒപിഡിയിൽ ടോക്കൺ സംവിധാനമില്ല", "രോഗികൾ മണിക്കൂറുകളോളം വെയിലത്ത് കാത്തുനിൽക്കുന്നു", "വരി തെറ്റിക്കുന്നവരെ നിയന്ത്രിക്കുന്നില്ല"],
        "Punjabi": ["ਓਪੀਡੀ ਵਿੱਚ ਟੋਕਨ ਸਿਸਟਮ ਨਹੀਂ ਹੈ", "ਮਰੀਜ਼ ਘੰਟਿਆਂ ਬੱਧੀ ਧੁੱਪ ਵਿੱਚ ਖੜ੍ਹੇ ਹਨ", "ਲਾਈਨ ਤੋੜਨ ਵਾਲਿਆਂ 'ਤੇ ਕੋਈ ਕੰਟਰੋਲ ਨਹੀਂ ਹੈ"],
    },

    "Accessibility": {
        "English": ["no wheelchair ramp at entrance", "no lift for disabled patients", "wheelchair not available", "no braille signage for blind patients", "toilets not accessible for disabled", "no interpreter for deaf patients"],
        "Hindi": ["प्रवेश द्वार पर व्हीलचेयर रैंप नहीं है", "विकलांग मरीज़ों के लिए लिफ्ट नहीं", "व्हीलचेयर उपलब्ध नहीं", "दृष्टिहीनों के लिए ब्रेल साइनेज नहीं", "विकलांगों के लिए शौचालय सुलभ नहीं"],
        "Tamil": ["நுழைவாயிலில் சக்கர நாற்காலி சரிவு இல்லை", "மாற்றுத்திறனாளிகளுக்கு லிப்ட் இல்லை", "சக்கர நாற்காலி கிடைக்கவில்லை"],
        "Telugu": ["ప్రవేశ ద్వారంలో వీల్ చెయిర్ ర్యాంప్ లేదు", "వికలాంగులకు లిఫ్ట్ లేదు", "వీల్ చెయిర్ అందుబాటులో లేదు"],
        "Bengali": ["প্রবেশদ্বারে হুইলচেয়ার র‍্যাম্প নেই", "প্রতিবন্ধী রোগীদের জন্য লিফট নেই", "হুইলচেয়ার পাওয়া যাচ্ছে না"],
        "Gujarati": ["પ્રવેશદ્વાર પર વ્હીલચેર રેમ્પ નથી", "વિકલાંગ દર્દીઓ માટે લિફ્ટ નથી", "વ્હીલચેર ઉપલબ્ધ નથી"],
        "Kannada": ["ಪ್ರವೇಶದ್ವಾರದಲ್ಲಿ ಗಾಲಿಕುರ್ಚಿ ರಾಂಪ್ ಇಲ್ಲ", "ವಿಕಲಚೇತನ ರೋಗಿಗಳಿಗೆ ಲಿಫ್ಟ್ ಇಲ್ಲ", "ಗಾಲಿಕುರ್ಚಿ ಲಭ್ಯವಿಲ್ಲ"],
        "Malayalam": ["പ്രവേശന കവാടത്തിൽ വീൽചെയർ റാംപ് ഇല്ല", "വികലാംഗരായ രോഗികൾക്ക് ലിഫ്റ്റ് ഇല്ല", "വീൽചെയർ ലഭ്യമല്ല"],
        "Punjabi": ["ਪ੍ਰਵੇਸ਼ ਦੁਆਰ 'ਤੇ ਵ੍ਹੀਲਚੇਅਰ ਰੈਂਪ ਨਹੀਂ ਹੈ", "ਅਪਾਹਜ ਮਰੀਜ਼ਾਂ ਲਈ ਲਿਫਟ ਨਹੀਂ ਹੈ", "ਵ੍ਹੀਲਚੇਅਰ ਉਪਲਬਧ ਨਹੀਂ ਹੈ"],
    },

    "Waste Disposal": {
        "English": ["biomedical waste not segregated", "used syringes dumped openly", "red and yellow bags mixed together", "waste incinerator not working", "sharps container overflowing", "waste dumped near water source"],
        "Hindi": ["बायोमेडिकल कचरा अलग नहीं किया जा रहा", "इस्तेमाल की हुई सिरिंज खुले में फेंकी गई", "लाल और पीले बैग मिला दिए गए", "कचरा भट्टी काम नहीं कर रही", "शार्प्स कंटेनर ओवरफ़्लो हो रहा"],
        "Tamil": ["உயிர் மருத்துவக் கழிவுகள் பிரிக்கப்படவில்லை", "பயன்படுத்திய ஊசிகள் வெளியே கொட்டப்பட்டுள்ளன", "சிவப்பு மற்றும் மஞ்சள் பைகள் கலக்கப்பட்டுள்ளன"],
        "Telugu": ["బయోమెడికల్ వేస్ట్ విడదీయబడలేదు", "వాడిన సిరింజ్‌లు బహిరంగంగా పడవేయబడ్డాయి", "ఎరుపు మరియు పసుపు సంచులు కలిసిపోయాయి"],
        "Bengali": ["বায়োমেডিক্যাল বর্জ্য আলাদা করা হচ্ছে না", "ব্যবহৃত সিরিঞ্জ খোলা জায়গায় ফেলা হচ্ছে", "লাল ও হলুদ ব্যাগ মেশানো হয়েছে"],
        "Gujarati": ["બાયોમેડિકલ કચરો અલગ નથી કરાતો", "વપરાયેલી સિરીંજ ખુલ્લામાં ફેંકી દેવાઈ છે", "લાલ અને પીળી થેલીઓ ભેગી કરી દીધી છે"],
        "Kannada": ["ಜೈವಿಕ ವೈದ್ಯಕೀಯ ತ್ಯಾಜ್ಯವನ್ನು ಪ್ರತ್ಯೇಕಿಸುತ್ತಿಲ್ಲ", "ಬಳಸಿದ ಸಿರಿಂಜ್‌ಗಳನ್ನು ತೆರೆದ ಸ್ಥಳದಲ್ಲಿ ಎಸೆಯಲಾಗಿದೆ", "ಕೆಂಪು ಮತ್ತು ಹಳದಿ ಚೀಲಗಳನ್ನು ಬೆರೆಸಲಾಗಿದೆ"],
        "Malayalam": ["ബയോമെഡിക്കൽ മാലിന്യങ്ങൾ വേർതിരിക്കുന്നില്ല", "ഉപയോഗിച്ച സിറിഞ്ചുകൾ തുറസ്സായ സ്ഥലത്ത് ഉപേക്ഷിച്ചു", "ചുവപ്പും മഞ്ഞയും ബാഗുകൾ കലർത്തി"],
        "Punjabi": ["ਬਾਇਓਮੈਡੀਕਲ ਕਚਰਾ ਵੱਖਰਾ ਨਹੀਂ ਕੀਤਾ ਜਾ ਰਿਹਾ", "ਵਰਤੀਆਂ ਹੋਈਆਂ ਸਰਿੰਜਾਂ ਖੁੱਲ੍ਹੇ ਵਿੱਚ ਸੁੱਟੀਆਂ ਗਈਆਂ", "ਲਾਲ ਅਤੇ ਪੀਲੇ ਬੈਗ ਮਿਲਾ ਦਿੱਤੇ ਗਏ ਹਨ"],
    },

    "Other": {
        "English": ["canteen food is unhygienic", "hospital parking lot is chaotic", "mosquito menace in the hospital", "stray dogs roaming inside hospital", "hospital timings not displayed properly", "no complaint box available", "staff taking long unauthorized breaks"],
        "Hindi": ["कैंटीन का खाना अस्वच्छ है", "अस्पताल की पार्किंग अव्यवस्थित है", "अस्पताल में मच्छरों का प्रकोप है", "अस्पताल में आवारा कुत्ते घूम रहे हैं", "अस्पताल का समय ठीक से नहीं लगा", "शिकायत पेटी उपलब्ध नहीं"],
        "Tamil": ["உணவகத்தின் உணவு சுகாதாரமற்றது", "மருத்துவமனை வாகன நிறுத்துமிடம் ஒழுங்கற்றது", "மருத்துவமனையில் கொசு தொல்லை"],
        "Telugu": ["కాంటీన్ భోజనం అపరిశుభ్రంగా ఉంది", "ఆస్పత్రి పార్కింగ్ అస్తవ్యస్తంగా ఉంది", "ఆస్పత్రిలో దోమల బాధ"],
        "Bengali": ["ক্যান্টিনের খাবার অস্বাস্থ্যকর", "হাসপাতালের পার্কিং বিশৃঙ্খল", "হাসপাতালে মশার উপদ্রব"],
        "Gujarati": ["કેન્ટીનનો ખોરાક અસ્વચ્છ છે", "હોસ્પિટલનું પાર્કિંગ અવ્યવસ્થિત છે", "હોસ્પિટલમાં મચ્છરોનો ઉપદ્રવ છે"],
        "Kannada": ["ಕ್ಯಾಂಟೀನ್ ಆಹಾರ ಅಶುಚಿಯಾಗಿದೆ", "ಆಸ್ಪತ್ರೆಯ ಪಾರ್ಕಿಂಗ್ ಅಸ್ತವ್ಯಸ್ತವಾಗಿದೆ", "ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಸೊಳ್ಳೆಗಳ ಕಾಟವಿದೆ"],
        "Malayalam": ["കാന്റീനിലെ ഭക്ഷണം വൃത്തിഹീനമാണ്", "ആശുപത്രി പാർക്കിംഗ് അലങ്കോലമാണ്", "ആശുപത്രിയിൽ കൊതുക് ശല്യം"],
        "Punjabi": ["ਕੰਟੀਨ ਦਾ ਖਾਣਾ ਗੰਦਾ ਹੈ", "ਹਸਪਤਾਲ ਦੀ ਪਾਰਕਿੰਗ ਬਹੁਤ ਖਰਾਬ ਹੈ", "ਹਸਪਤਾਲ ਵਿੱਚ ਮੱਛਰਾਂ ਦਾ ਬਹੁਤ ਜ਼ੋਰ ਹੈ"],
    },
}


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 5 — CONTEXTUAL VOCABULARY PER LANGUAGE
# ════════════════════════════════════════════════════════════════════════════

TIME_REFERENCES: Dict[str, List[str]] = {
    "English": ["last week", "three days", "one month", "two weeks", "yesterday", "several months", "since morning", "past fortnight", "over a year", "many days"],
    "Hindi": ["पिछले हफ़्ते", "तीन दिन", "एक महीने", "दो हफ़्ते", "कल", "कई महीनों", "सुबह से", "पिछले पखवाड़े", "एक साल"],
    "Marathi": ["गेल्या आठवड्यापासून", "तीन दिवस", "एक महिना", "दोन आठवडे", "कालपासून", "अनेक महिने", "सकाळपासून"],
    "Tamil": ["கடந்த வாரம்", "மூன்று நாட்கள்", "ஒரு மாதம்", "இரண்டு வாரங்கள்", "நேற்று முதல்", "பல மாதங்கள்", "இன்று காலை முதல்"],
    "Telugu": ["గత వారం", "మూడు రోజులు", "ఒక నెల", "రెండు వారాలు", "నిన్న నుండి", "చాలా నెలలు", "ఉదయం నుండి"],
    "Bengali": ["গত সপ্তাহ", "তিন দিন", "এক মাস", "দুই সপ্তাহ", "গতকাল থেকে", "কয়েক মাস", "সকাল থেকে"],
    "Gujarati": ["ગયા અઠવાડિયે", "ત્રણ દિવસ", "એક મહિનો", "બે અઠવાડિયા", "ગઈકાલથી", "ઘણા મહિના", "સવારથી"],
    "Kannada": ["ಕಳೆದ ವಾರ", "ಮೂರು ದಿನ", "ಒಂದು ತಿಂಗಳು", "ಎರಡು ವಾರ", "ನಿನ್ನೆಯಿಂದ", "ಹಲವು ತಿಂಗಳು", "ಬೆಳಿಗ್ಗೆಯಿಂದ"],
    "Malayalam": ["കഴിഞ്ഞ ആഴ്ച", "മൂന്ന് ദിവസം", "ഒരു മാസം", "രണ്ട് ആഴ്ച", "ഇന്നലെ മുതൽ", "പല മാസം", "രാവിലെ മുതൽ"],
    "Punjabi": ["ਪਿਛਲੇ ਹਫ਼ਤੇ", "ਤਿੰਨ ਦਿਨ", "ਇੱਕ ਮਹੀਨਾ", "ਦੋ ਹਫ਼ਤੇ", "ਕੱਲ੍ਹ ਤੋਂ", "ਕਈ ਮਹੀਨੇ", "ਸਵੇਰੇ ਤੋਂ"],
    "Odia": ["ଗତ ସପ୍ତାହ", "ତିନି ଦିନ", "ଏକ ମାସ", "ଦୁଇ ସପ୍ତାହ", "ଗତକାଲି ଠାରୁ", "ଅନେକ ମାସ"],
    "Assamese": ["যোৱা সপ্তাহ", "তিনি দিন", "এক মাহ", "দুই সপ্তাহ", "কালিৰ পৰা", "কেইবা মাহ"],
    "Urdu": ["پچھلے ہفتے", "تین دن", "ایک مہینہ", "دو ہفتے", "کل سے", "کئی مہینے", "صبح سے"],
    "Konkani": ["गेल्या सप्तकासावन", "तीन दीस", "एक म्हयनो", "दोन सप्तक", "काल सावन"],
    "Sindhi": ["گذريل هفتي", "ٽي ڏينهن", "هڪ مهينو", "ٻه هفتا", "ڪالهه کان"],
    "Manipuri": ["অহানবা সপ্তাহদগী", "হুম্নি নুমিৎ", "অমা লা", "অনী সপ্তাহ", "ঙসিদগী"],
    "Bodo": ["थांनाय सप्ताह निफ्राय", "थां सान", "मोनसे", "नै सप्ताह", "मैया निफ्राय"],
    "Dogri": ["पिछले हफ़्ते तों", "त्रै दिन", "इक म्हीना", "दो हफ़्ते", "कल्ह तों"],
    "Kashmiri": ["گذرمت ہفتہ", "ترے دوہ", "اکھ مینہٕ", "ژے ہفتہ", "راتھ پیٹھ"],
    "Sanskrit": ["गतसप्ताहात्", "त्रिदिनानि", "एकमासम्", "द्विसप्ताहम्", "ह्यः प्रभृति"],
}


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 6 — SEVERITY DISTRIBUTION PER CATEGORY
# ════════════════════════════════════════════════════════════════════════════

SEVERITY_WEIGHTS: Dict[str, Dict[str, float]] = {
    "Infrastructure":       {"Critical": 0.10, "High": 0.30, "Medium": 0.40, "Low": 0.20},
    "Medicine Stock":       {"Critical": 0.20, "High": 0.40, "Medium": 0.30, "Low": 0.10},
    "Medical Equipment":    {"Critical": 0.15, "High": 0.35, "Medium": 0.35, "Low": 0.15},
    "Doctor Availability":  {"Critical": 0.15, "High": 0.40, "Medium": 0.30, "Low": 0.15},
    "Nurse Behaviour":      {"Critical": 0.05, "High": 0.20, "Medium": 0.45, "Low": 0.30},
    "Hospital Staff":       {"Critical": 0.05, "High": 0.20, "Medium": 0.40, "Low": 0.35},
    "Cleanliness":          {"Critical": 0.05, "High": 0.25, "Medium": 0.45, "Low": 0.25},
    "Electricity":          {"Critical": 0.20, "High": 0.35, "Medium": 0.30, "Low": 0.15},
    "Water Supply":         {"Critical": 0.15, "High": 0.30, "Medium": 0.35, "Low": 0.20},
    "Ambulance":            {"Critical": 0.30, "High": 0.35, "Medium": 0.25, "Low": 0.10},
    "Blood Bank":           {"Critical": 0.25, "High": 0.35, "Medium": 0.25, "Low": 0.15},
    "Laboratory":           {"Critical": 0.10, "High": 0.30, "Medium": 0.40, "Low": 0.20},
    "Radiology":            {"Critical": 0.10, "High": 0.30, "Medium": 0.40, "Low": 0.20},
    "Pharmacy":             {"Critical": 0.10, "High": 0.30, "Medium": 0.40, "Low": 0.20},
    "Operation Theatre":    {"Critical": 0.25, "High": 0.35, "Medium": 0.25, "Low": 0.15},
    "Emergency Services":   {"Critical": 0.40, "High": 0.30, "Medium": 0.20, "Low": 0.10},
    "Billing":              {"Critical": 0.05, "High": 0.15, "Medium": 0.40, "Low": 0.40},
    "Government Schemes":   {"Critical": 0.05, "High": 0.20, "Medium": 0.40, "Low": 0.35},
    "Appointment":          {"Critical": 0.05, "High": 0.15, "Medium": 0.40, "Low": 0.40},
    "General Inquiry":      {"Critical": 0.02, "High": 0.08, "Medium": 0.30, "Low": 0.60},
    "Medical Negligence":   {"Critical": 0.40, "High": 0.35, "Medium": 0.15, "Low": 0.10},
    "Patient Safety":       {"Critical": 0.35, "High": 0.35, "Medium": 0.20, "Low": 0.10},
    "Security":             {"Critical": 0.10, "High": 0.30, "Medium": 0.35, "Low": 0.25},
    "Sanitation":           {"Critical": 0.10, "High": 0.25, "Medium": 0.40, "Low": 0.25},
    "IT Systems":           {"Critical": 0.10, "High": 0.25, "Medium": 0.40, "Low": 0.25},
    "Power Backup":         {"Critical": 0.25, "High": 0.35, "Medium": 0.25, "Low": 0.15},
    "Queue Management":     {"Critical": 0.05, "High": 0.15, "Medium": 0.40, "Low": 0.40},
    "Accessibility":        {"Critical": 0.05, "High": 0.25, "Medium": 0.40, "Low": 0.30},
    "Waste Disposal":       {"Critical": 0.15, "High": 0.30, "Medium": 0.35, "Low": 0.20},
    "Other":                {"Critical": 0.05, "High": 0.15, "Medium": 0.40, "Low": 0.40},
}


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 7 — DATASET GENERATOR CLASS
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class GrievanceSample:
    """Single grievance sample with full metadata."""
    id: int
    language: str
    state: str
    district: str
    hospital_type: str
    department: str
    severity: str
    portal: str
    response_time: str
    text: str
    category: str


class GrievanceDatasetGenerator:
    """
    Production-grade synthetic dataset generator for healthcare grievances.

    Generates balanced, multilingual complaints by combining sentence
    patterns with category-specific phrases and contextual metadata.
    """

    def __init__(self, config: Optional[DatasetGeneratorConfig] = None):
        self.config = config or DatasetGeneratorConfig()
        
        # Adjust dataset size for hackathon requirements if default
        if self.config.num_samples == 100_000:
            self.config.num_samples = 75_000
            
        self._rng = random.Random(self.config.seed)
        self._state_list = list(STATES_AND_DISTRICTS.keys())
        self._all_areas = HOSPITAL_AREAS

        # Precompute fallback chains: language → best available template language
        self._pattern_fallback: Dict[str, str] = {}
        self._phrase_fallback: Dict[str, Dict[str, str]] = {}
        self._time_fallback: Dict[str, str] = {}

        devanagari_langs = {"Hindi", "Marathi", "Konkani", "Bodo", "Dogri", "Sanskrit"}

        for lang in self.config.languages:
            # Sentence pattern fallback
            if lang in SENTENCE_PATTERNS:
                self._pattern_fallback[lang] = lang
            elif lang in devanagari_langs:
                self._pattern_fallback[lang] = "Hindi"
            else:
                self._pattern_fallback[lang] = "English"

            # Time reference fallback
            if lang in TIME_REFERENCES:
                self._time_fallback[lang] = lang
            elif lang in devanagari_langs:
                self._time_fallback[lang] = "Hindi"
            else:
                self._time_fallback[lang] = "English"

            # Per-category phrase fallback
            self._phrase_fallback[lang] = {}
            for cat in self.config.categories:
                phrases = CATEGORY_PHRASES.get(cat, {})
                if lang in phrases:
                    self._phrase_fallback[lang][cat] = lang
                elif "Hindi" in phrases and lang in devanagari_langs:
                    self._phrase_fallback[lang][cat] = "Hindi"
                elif "English" in phrases:
                    self._phrase_fallback[lang][cat] = "English"
                else:
                    self._phrase_fallback[lang][cat] = list(phrases.keys())[0] if phrases else "English"

        logger.info(
            "Generator initialised: %d categories × %d languages → target %d samples",
            len(self.config.categories),
            len(self.config.languages),
            self.config.num_samples,
        )

    # ── core generation ────────────────────────────────────────────────

    def _pick_severity(self, category: str) -> str:
        weights = SEVERITY_WEIGHTS.get(category, SEVERITY_WEIGHTS["Other"])
        levels = list(weights.keys())
        probs = list(weights.values())
        return self._rng.choices(levels, weights=probs, k=1)[0]

    def _pick_state_district(self) -> Tuple[str, str]:
        state = self._rng.choice(self._state_list)
        district = self._rng.choice(STATES_AND_DISTRICTS[state])
        return state, district

    def _build_complaint(self, category: str, language: str, state: str, district: str, hospital_type: str, severity: str) -> str:
        """Build a single complaint string by combining pattern + phrase + context."""
        # Resolve pattern language
        pat_lang = self._pattern_fallback.get(language, "English")
        patterns = SENTENCE_PATTERNS[pat_lang]
        
        # Shuffle patterns and select to increase randomness
        shuffled_patterns = list(patterns)
        self._rng.shuffle(shuffled_patterns)
        pattern = shuffled_patterns[0]

        # Resolve category phrase
        phr_lang = self._phrase_fallback.get(language, {}).get(category, "English")
        phrases = CATEGORY_PHRASES.get(category, {}).get(phr_lang, ["general issue"])
        
        # Shuffle phrases
        shuffled_phrases = list(phrases)
        self._rng.shuffle(shuffled_phrases)
        phrase = shuffled_phrases[0]

        # Resolve time reference
        time_lang = self._time_fallback.get(language, "English")
        time_refs = TIME_REFERENCES[time_lang]
        
        # Shuffle time references
        shuffled_time = list(time_refs)
        self._rng.shuffle(shuffled_time)
        time_ref = shuffled_time[0]

        # Area (mixed language — hospital area names are universal)
        area = self._rng.choice(self._all_areas)

        # Basic text generation
        text = pattern.format(phrase=phrase, area=area, time=time_ref)

        # Inject domain-specific detail for richer text (English only as per original logic)
        # Avoid generating overly long paragraphs (max ~40 words total)
        detail_suffix = self._get_domain_detail(category, state, district, hospital_type, language)

        if detail_suffix and self._rng.random() < 0.60:
            text = f"{text}. {detail_suffix}"
            
        # Add Urgency phrasing if Critical/High severity (Mostly for English to avoid grammar mess in Indic languages, or just simple prefix)
        if severity in ["Critical", "High"] and self._rng.random() < 0.40:
            if language == "English":
                urgency = self._rng.choice(URGENCY_WORDING)
                text = f"{urgency} {text}"
                
        # Clean up any weird double spaces
        text = text.replace("  ", " ").strip()
        
        # Ensure it's not excessively long (truncate gently if it somehow exceeds 40 words, though rare)
        words = text.split()
        if len(words) > 40:
            text = " ".join(words[:40]) + "..."

        return text

    def _get_domain_detail(self, category: str, state: str, district: str, hospital_type: str, language: str) -> str:
        """Return a random domain-specific detail to enrich complaint text. (Mainly in English/Bilingual mix)"""
        # Only inject these detailed rich histories if language is English to prevent awkward grammatical mixing,
        # or use very simple nouns for other languages.
        if language != "English":
            # For non-English, just return simple entity names sometimes to add context
            if self._rng.random() < 0.3:
                if category == "Medicine Stock": return self._rng.choice(MEDICINES)
                if category == "Medical Equipment": return self._rng.choice(MEDICAL_EQUIPMENT)
                if category == "Patient Safety": return self._rng.choice(DISEASES[:20])
            return ""

        # Rich combinations for English
        context_chance = self._rng.random()
        
        # Sometimes mention location/hospital type
        location_prefix = ""
        if context_chance < 0.3:
            location_prefix = f"At {hospital_type} in {district}, {state}. "
        elif context_chance < 0.5:
            location_prefix = f"This is at {district} {hospital_type}. "

        detail = ""
        if category == "Medicine Stock":
            med = self._rng.choice(MEDICINES)
            detail = self._rng.choice([
                f"Specifically {med} is needed urgently",
                f"{med} has not been available",
                f"Patients need {med} but it is out of stock",
            ])
        elif category == "Medical Equipment":
            eq = self._rng.choice(MEDICAL_EQUIPMENT)
            weather = self._rng.choice(WEATHER_EVENTS)
            detail = self._rng.choice([
                f"The {eq} is broken",
                f"{eq} needs immediate repair",
                f"Without {eq} treatment is not possible",
                f"It stopped working after {weather}",
            ])
        elif category == "Government Schemes":
            scheme = self._rng.choice(GOVERNMENT_SCHEMES)
            detail = self._rng.choice([
                f"Benefits under {scheme} are being denied",
                f"{scheme} card was rejected",
                f"Staff is unaware of {scheme}",
            ])
        elif category in ("Doctor Availability", "Hospital Staff"):
            staff = self._rng.choice(STAFF_DESIGNATIONS)
            group = self._rng.choice(PATIENT_GROUPS)
            detail = self._rng.choice([
                f"The {staff} has not reported for duty",
                f"No {staff} is available",
                f"{group.capitalize()} are waiting for the {staff}",
            ])
        elif category == "Patient Safety":
            disease = self._rng.choice(DISEASES[:20])
            detail = self._rng.choice([
                f"A {disease} outbreak risk exists",
                f"Patients with {disease} are at risk",
            ])
        else:
            # Generic enrichments
            if self._rng.random() < 0.2:
                group = self._rng.choice(PATIENT_GROUPS)
                detail = f"{group.capitalize()} are suffering the most."

        if detail:
            return f"{location_prefix}{detail}".strip()
        return location_prefix.strip()

    def _generate_single(self, sample_id: int, category: str, language: str) -> GrievanceSample:
        """Generate a single grievance sample with full metadata."""
        state, district = self._pick_state_district()
        severity = self._pick_severity(category)
        hospital_type = self._rng.choice(HOSPITAL_TYPES)
        text = self._build_complaint(category, language, state, district, hospital_type, severity)

        return GrievanceSample(
            id=sample_id,
            language=language,
            state=state,
            district=district,
            hospital_type=hospital_type,
            department=CATEGORY_DEPARTMENT_MAP.get(category, "General Administration"),
            severity=severity,
            portal=CATEGORY_PORTAL_MAP.get(category, "HELPDESK_PORTAL"),
            response_time=SEVERITY_RESPONSE_MAP.get(severity, "72 hours"),
            text=text,
            category=category,
        )

    # ── public API ─────────────────────────────────────────────────────

    def generate(self) -> List[Dict[str, Any]]:
        """Generate the full dataset, balanced across categories and languages."""
        n = self.config.num_samples
        categories = self.config.categories
        languages = self.config.languages
        num_cats = len(categories)
        num_langs = len(languages)
        num_pairs = num_cats * num_langs

        samples_per_pair = n // num_pairs
        remainder = n % num_pairs

        logger.info(
            "Generating %d samples (%d per category-language pair, %d remainder)…",
            n, samples_per_pair, remainder,
        )

        dataset: List[Dict[str, Any]] = []
        sample_id = 1

        # Round-robin balanced generation
        pairs = [(cat, lang) for cat in categories for lang in languages]
        self._rng.shuffle(pairs)

        for i, (cat, lang) in enumerate(pairs):
            count = samples_per_pair + (1 if i < remainder else 0)
            for _ in range(count):
                sample = self._generate_single(sample_id, cat, lang)
                dataset.append(asdict(sample))
                sample_id += 1

        self._rng.shuffle(dataset)

        # Re-index after shuffle
        for idx, sample in enumerate(dataset, start=1):
            sample["id"] = idx

        logger.info("Dataset generation complete: %d samples", len(dataset))
        return dataset

    def save(self, dataset: List[Dict[str, Any]], path: Optional[Path] = None) -> Path:
        """Persist the dataset to disk as JSON."""
        output = path or Path(self.config.output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        with open(output, "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)

        size_mb = output.stat().st_size / (1024 * 1024)
        logger.info("Saved dataset to %s (%.2f MB)", output, size_mb)
        return output

    def print_statistics(self, dataset: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Log and return summary statistics about the generated dataset."""
        from collections import Counter

        cat_counts = Counter(s["category"] for s in dataset)
        lang_counts = Counter(s["language"] for s in dataset)
        sev_counts = Counter(s["severity"] for s in dataset)
        state_counts = Counter(s["state"] for s in dataset)

        stats = {
            "total_samples": len(dataset),
            "num_categories": len(cat_counts),
            "num_languages": len(lang_counts),
            "num_states": len(state_counts),
            "category_distribution": dict(cat_counts.most_common()),
            "language_distribution": dict(lang_counts.most_common()),
            "severity_distribution": dict(sev_counts.most_common()),
            "avg_text_length": sum(len(s["text"]) for s in dataset) / len(dataset),
        }

        logger.info("── Dataset Statistics ──")
        logger.info("  Total samples   : %d", stats["total_samples"])
        logger.info("  Categories      : %d", stats["num_categories"])
        logger.info("  Languages       : %d", stats["num_languages"])
        logger.info("  States covered  : %d", stats["num_states"])
        logger.info("  Avg text length : %.1f chars", stats["avg_text_length"])
        logger.info("  Severity dist   : %s", stats["severity_distribution"])

        return stats


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 8 — ENTRY POINT
# ════════════════════════════════════════════════════════════════════════════

def generate_dataset(
    num_samples: int = 75_000,
    output_path: Optional[str] = None,
    seed: int = 42,
) -> Path:
    """
    Top-level function to generate and save the grievance dataset.

    Parameters
    ----------
    num_samples : int
        Number of samples to generate.
    output_path : str, optional
        Where to save the JSON file. Defaults to the configured location.
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    Path
        The path to the saved dataset file.
    """
    config = DatasetGeneratorConfig(
        num_samples=num_samples,
        seed=seed,
    )
    if output_path:
        config.output_path = output_path

    generator = GrievanceDatasetGenerator(config)
    dataset = generator.generate()
    path = generator.save(dataset)
    generator.print_statistics(dataset)
    return path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="AarogyaOne Synthetic Grievance Dataset Generator",
    )
    parser.add_argument(
        "--num-samples", type=int, default=75_000,
        help="Number of samples to generate (default: 75000)",
    )
    parser.add_argument(
        "--output", type=str, default=None,
        help="Output JSON file path (default: configured path)",
    )
    parser.add_argument(
        "--seed", type=int, default=42,
        help="Random seed (default: 42)",
    )
    args = parser.parse_args()
    generate_dataset(
        num_samples=args.num_samples,
        output_path=args.output,
        seed=args.seed,
    )
