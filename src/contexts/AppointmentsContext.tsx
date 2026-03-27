import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SharedAppointment {
  id: string;
  title: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string | null;
  priority: string;
  examination_id?: string;
  source: "local" | "db";
}

interface AppointmentsContextValue {
  appointments: SharedAppointment[];
  addLocalAppointments: (apts: Omit<SharedAppointment, "id" | "source">[]) => void;
  clearLocalAppointments: () => void;
  refreshFromDb: () => Promise<void>;
  loading: boolean;
}

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null);

const LS_KEY = "echocure_local_appointments";

function loadLocal(): SharedAppointment[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocal(apts: SharedAppointment[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(apts));
}

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [dbAppointments, setDbAppointments] = useState<SharedAppointment[]>([]);
  const [localAppointments, setLocalAppointments] = useState<SharedAppointment[]>(loadLocal);
  const [loading, setLoading] = useState(true);

  const refreshFromDb = useCallback(async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true });
    if (data) {
      setDbAppointments(
        data.map((a: any) => ({
          id: a.id,
          title: a.title,
          appointment_date: a.appointment_date,
          priority: a.priority,
          examination_id: a.examination_id,
          source: "db" as const,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  const addLocalAppointments = useCallback((apts: Omit<SharedAppointment, "id" | "source">[]) => {
    const newApts: SharedAppointment[] = apts.map((a, i) => ({
      ...a,
      id: `local-${Date.now()}-${i}`,
      source: "local" as const,
    }));
    setLocalAppointments((prev) => {
      const next = [...prev, ...newApts];
      saveLocal(next);
      return next;
    });
  }, []);

  const clearLocalAppointments = useCallback(() => {
    setLocalAppointments([]);
    localStorage.removeItem(LS_KEY);
  }, []);

  // Merge: DB appointments take precedence; local ones are for live doctor preview
  const appointments = [
    ...dbAppointments,
    ...localAppointments.filter(
      (la) => !dbAppointments.some(
        (da) => da.appointment_date === la.appointment_date && da.title === la.title
      )
    ),
  ];

  return (
    <AppointmentsContext.Provider value={{ appointments, addLocalAppointments, clearLocalAppointments, refreshFromDb, loading }}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used within AppointmentsProvider");
  return ctx;
}
