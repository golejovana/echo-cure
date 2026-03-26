import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Search, Eye, Calendar, FileText, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const MOCK_EXAMINATIONS = [
  { id: 1, date: "25.03.2026.", patient: "Marko Petrović", diagnosis: "I20.0 — Nestabilna angina pektoris", status: "Završen" },
  { id: 2, date: "24.03.2026.", patient: "Ana Jovanović", diagnosis: "J18.9 — Pneumonija, nespecifikovana", status: "Čeka nalaze" },
  { id: 3, date: "23.03.2026.", patient: "Stefan Nikolić", diagnosis: "K21.0 — Gastroezofagealni refluks", status: "Završen" },
  { id: 4, date: "22.03.2026.", patient: "Milica Đorđević", diagnosis: "E11.9 — Dijabetes melitus tip 2", status: "Kontrola" },
  { id: 5, date: "20.03.2026.", patient: "Nikola Stojanović", diagnosis: "M54.5 — Lumbalni bol", status: "Završen" },
  { id: 6, date: "18.03.2026.", patient: "Jovana Ilić", diagnosis: "N39.0 — Urinarna infekcija", status: "Završen" },
  { id: 7, date: "15.03.2026.", patient: "Đorđe Pavlović", diagnosis: "I10 — Esencijalna hipertenzija", status: "Kontrola" },
  { id: 8, date: "12.03.2026.", patient: "Maja Kostić", diagnosis: "J06.9 — Akutna infekcija gornjih disajnih puteva", status: "Završen" },
];

const PATIENT_HISTORY = [
  { id: 1, date: "25.03.2026.", doctor: "Dr. Marko Petrović", diagnosis: "I20.0 — Nestabilna angina pektoris", status: "Završen" },
  { id: 2, date: "10.03.2026.", doctor: "Dr. Ana Ilić", diagnosis: "I10 — Esencijalna hipertenzija", status: "Kontrola" },
  { id: 3, date: "28.02.2026.", doctor: "Dr. Marko Petrović", diagnosis: "Z00.0 — Opšti medicinski pregled", status: "Završen" },
];

const statusColor = (status: string) => {
  if (status === "Završen") return "bg-accent/10 text-accent";
  if (status === "Čeka nalaze") return "bg-destructive/10 text-destructive";
  return "bg-primary/10 text-primary";
};

export default function HistoryPage() {
  const [role, setRole] = useState<AppRole>("doctor");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
        if (data?.role) setRole(data.role);
      }
      setLoading(false);
    };
    fetchRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isDoctor = role === "doctor";
  const data = isDoctor ? MOCK_EXAMINATIONS : PATIENT_HISTORY;
  const filtered = data.filter((row) => {
    const haystack = isDoctor
      ? `${row.patient} ${row.diagnosis}`.toLowerCase()
      : `${(row as typeof PATIENT_HISTORY[0]).doctor} ${row.diagnosis}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <DashboardLayout role={role}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <History size={22} strokeWidth={1.5} className="text-primary" />
              Istorija pregleda
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isDoctor ? "Pregled svih prethodnih pregleda pacijenata." : "Vaši prethodni medicinski pregledi."}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži…"
              className="pl-9 pr-4 py-2.5 rounded-2xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64 transition-shadow duration-200 shadow-sm focus:shadow-md"
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="led-card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                    <div className="flex items-center gap-1.5"><Calendar size={12} /> Datum</div>
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                    {isDoctor ? "Pacijent" : "Lekar"}
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                    <div className="flex items-center gap-1.5"><FileText size={12} /> Dijagnoza</div>
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                    <div className="flex items-center gap-1.5"><Filter size={12} /> Status</div>
                  </th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors duration-150 group">
                    <td className="px-5 py-4 text-sm text-foreground font-medium">{row.date}</td>
                    <td className="px-5 py-4 text-sm text-foreground">
                      {isDoctor ? row.patient : (row as typeof PATIENT_HISTORY[0]).doctor}
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground/80 max-w-xs truncate">{row.diagnosis}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-200 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10">
                        <Eye size={13} strokeWidth={1.8} />
                        Otvori
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border/20">
            {filtered.map((row) => (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {isDoctor ? row.patient : (row as typeof PATIENT_HISTORY[0]).doctor}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusColor(row.status)}`}>
                    {row.status}
                  </span>
                </div>
                <p className="text-xs text-foreground/70 truncate">{row.diagnosis}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{row.date}</span>
                  <button className="flex items-center gap-1 text-xs font-medium text-primary">
                    <Eye size={12} /> Otvori
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nema rezultata za „{search}"
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
