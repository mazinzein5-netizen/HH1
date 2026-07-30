import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface MedicalCondition {
  id: string;
  name: string;
  icd10?: string;
  diagnosedDate: string;
  status: "active" | "resolved" | "chronic";
  notes?: string;
}

export interface DrugAllergy {
  id: string;
  drug: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life-threatening";
}

export interface KardexEntry {
  id: string;
  medication: string;
  dose: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: "active" | "discontinued" | "completed";
  notes?: string;
  prescriberTitle?: string;
  prescriberIMC?: string;
  prescriberHSERef?: string;
  prescriptionDate?: string;
  prescriptionTime?: string;
  isRecurring?: boolean;
  reviewIntervalDays?: number;
  nextReviewDate?: string;
  pharmacy?: string;
  batchNumber?: string;
}

export interface Complaint {
  id: string;
  date: string;
  chiefComplaint: string;
  answers: { question: string; answer: string }[];
  aiSummary?: string;
  triageRecommendation?: string;
}

export interface PatientData {
  medicalHistory: MedicalCondition[];
  allergies: DrugAllergy[];
  kardex: KardexEntry[];
  complaints: Complaint[];
}

interface PatientContextType {
  data: PatientData;
  loading: boolean;
  addComplaint: (c: Complaint) => Promise<void>;
  refresh: () => Promise<void>;
}

const DEMO_PATIENT: PatientData = {
  medicalHistory: [
    { id: "mh1", name: "Hypertension", icd10: "I10", diagnosedDate: "2019-03-15", status: "active", notes: "Well controlled on Amlodipine." },
    { id: "mh2", name: "Type 2 Diabetes Mellitus", icd10: "E11", diagnosedDate: "2018-07-20", status: "chronic", notes: "HbA1c 7.2% — March 2025." },
    { id: "mh3", name: "Atrial Fibrillation", icd10: "I48", diagnosedDate: "2020-11-05", status: "active", notes: "Anticoagulated with Apixaban." },
  ],
  allergies: [
    { id: "al1", drug: "Penicillin", reaction: "Anaphylaxis", severity: "life-threatening" },
    { id: "al2", drug: "Codeine", reaction: "Respiratory depression", severity: "severe" },
  ],
  kardex: [
    {
      id: "kx1", medication: "Apixaban", dose: "5mg", frequency: "BD for AFib", route: "Oral",
      startDate: "2020-12-01", prescribedBy: "Dr. Ahmed Al-Rashid", status: "active",
      notes: "Do not crush. Check renal function every 6 months.",
      prescriberTitle: "Consultant Cardiologist", prescriberIMC: "IMC-12345", prescriberHSERef: "HSE-C-00412",
      prescriptionDate: "2020-12-01", prescriptionTime: "09:30",
      isRecurring: true, reviewIntervalDays: 90, nextReviewDate: "2026-09-01",
      pharmacy: "St. James's Hospital Pharmacy", batchNumber: "APX-2024-0831",
    },
    {
      id: "kx2", medication: "Atorvastatin", dose: "40mg", frequency: "ON for Hyperlipidemia", route: "Oral",
      startDate: "2019-01-10", prescribedBy: "Dr. Ahmed Al-Rashid", status: "active",
      prescriberTitle: "Consultant Cardiologist", prescriberIMC: "IMC-12345", prescriberHSERef: "HSE-C-00412",
      prescriptionDate: "2019-01-10", prescriptionTime: "10:00",
      isRecurring: true, reviewIntervalDays: 180, nextReviewDate: "2026-07-10",
      pharmacy: "St. James's Hospital Pharmacy", batchNumber: "ATV-2024-0614",
    },
    {
      id: "kx3", medication: "Metformin", dose: "500mg", frequency: "Twice daily (BD)", route: "Oral",
      startDate: "2018-08-01", prescribedBy: "Dr. Sara Khan", status: "active",
      notes: "Take with meals.",
      prescriberTitle: "Consultant Endocrinologist", prescriberIMC: "IMC-67890", prescriberHSERef: "HSE-E-00219",
      prescriptionDate: "2018-08-01", prescriptionTime: "08:45",
      isRecurring: true, reviewIntervalDays: 90, nextReviewDate: "2026-08-15",
      pharmacy: "Lloyds Pharmacy, Rathmines", batchNumber: "MET-2024-1102",
    },
    {
      id: "kx4", medication: "Amlodipine", dose: "5mg", frequency: "Once daily (OD)", route: "Oral",
      startDate: "2019-04-01", prescribedBy: "Dr. Ahmed Al-Rashid", status: "active",
      prescriberTitle: "Consultant Cardiologist", prescriberIMC: "IMC-12345", prescriberHSERef: "HSE-C-00412",
      prescriptionDate: "2019-04-01", prescriptionTime: "09:00",
      isRecurring: true, reviewIntervalDays: 180, nextReviewDate: "2026-10-01",
      pharmacy: "St. James's Hospital Pharmacy", batchNumber: "AML-2024-0723",
    },
  ],
  complaints: [],
};

const STORAGE_KEY = "ibnceena_demo_patient";

const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PatientData>(DEMO_PATIENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_PATIENT));
        setData(DEMO_PATIENT);
      }
    } catch {
      setData(DEMO_PATIENT);
    }
    setLoading(false);
  }

  async function save(next: PatientData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setData(next);
    } catch {}
  }

  async function addComplaint(c: Complaint) {
    const next = { ...data, complaints: [c, ...data.complaints] };
    await save(next);
  }

  return (
    <PatientContext.Provider value={{ data, loading, addComplaint, refresh: load }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used within PatientProvider");
  return ctx;
}
