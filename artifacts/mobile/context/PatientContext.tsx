import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

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

const SAMPLE: PatientData = {
  medicalHistory: [
    {
      id: "mh1",
      name: "Hypertension",
      icd10: "I10",
      diagnosedDate: "2019-03-15",
      status: "active",
      notes: "Well controlled on Amlodipine. BP target <130/80 mmHg.",
    },
    {
      id: "mh2",
      name: "Type 2 Diabetes Mellitus",
      icd10: "E11",
      diagnosedDate: "2018-07-20",
      status: "chronic",
      notes: "HbA1c 7.2% (March 2025). Diet controlled + Metformin.",
    },
    {
      id: "mh3",
      name: "Chronic Lower Back Pain",
      icd10: "M54.5",
      diagnosedDate: "2022-01-10",
      status: "active",
      notes: "L4/L5 disc herniation on MRI. Under physiotherapy management.",
    },
  ],
  allergies: [
    {
      id: "al1",
      drug: "Penicillin",
      reaction: "Anaphylaxis",
      severity: "life-threatening",
    },
    {
      id: "al2",
      drug: "Aspirin",
      reaction: "Gastric irritation and GI bleeding",
      severity: "moderate",
    },
  ],
  kardex: [
    {
      id: "kx1",
      medication: "Metformin",
      dose: "500mg",
      frequency: "Twice daily (BD)",
      route: "Oral",
      startDate: "2018-08-01",
      prescribedBy: "Dr. Ahmed Al-Rashid",
      status: "active",
      notes: "Take with meals to reduce GI side effects.",
    },
    {
      id: "kx2",
      medication: "Amlodipine",
      dose: "5mg",
      frequency: "Once daily (OD)",
      route: "Oral",
      startDate: "2019-04-01",
      prescribedBy: "Dr. Ahmed Al-Rashid",
      status: "active",
    },
    {
      id: "kx3",
      medication: "Naproxen",
      dose: "250mg",
      frequency: "Three times daily PRN",
      route: "Oral",
      startDate: "2022-02-01",
      prescribedBy: "Dr. Sara Khan",
      status: "active",
      notes: "For pain management. Take with food. Max 3 times/day.",
    },
  ],
  complaints: [],
};

const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<PatientData>({
    medicalHistory: [],
    allergies: [],
    kardex: [],
    complaints: [],
  });
  const [loading, setLoading] = useState(true);

  const getKey = () => `ibnceena_patient_${user?.id}`;

  useEffect(() => {
    if (user) {
      load();
    } else {
      setData({ medicalHistory: [], allergies: [], kardex: [], complaints: [] });
      setLoading(false);
    }
  }, [user?.id]);

  async function load() {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(getKey());
      if (stored) {
        setData(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem(getKey(), JSON.stringify(SAMPLE));
        setData(SAMPLE);
      }
    } catch {}
    setLoading(false);
  }

  async function save(next: PatientData) {
    try {
      await AsyncStorage.setItem(getKey(), JSON.stringify(next));
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
