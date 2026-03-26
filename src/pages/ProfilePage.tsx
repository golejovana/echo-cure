import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Settings, Globe, Bell, LogOut,
  Stethoscope, Building2, Hash, Camera, HeartPulse, Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function ProfilePage() {
  const [role, setRole] = useState<AppRole>("doctor");
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [lang, setLang] = useState<"sr" | "en">("sr");
  const [notifications, setNotifications] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        const { data } = await supabase.from("profiles").select("role, full_name").eq("user_id", user.id).single();
        if (data?.role) setRole(data.role);
        if (data?.full_name) setFullName(data.full_name);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isDoctor = role === "doctor";

  return (
    <DashboardLayout role={role}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Profile Header */}
        <div className="led-card p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0 shadow-inner">
                {isDoctor ? (
                  <Stethoscope size={32} strokeWidth={1.2} className="text-primary" />
                ) : (
                  <HeartPulse size={32} strokeWidth={1.2} className="text-accent" />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow opacity-0 group-hover:opacity-100 duration-200">
                <Camera size={12} strokeWidth={1.8} className="text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {fullName || (isDoctor ? "Dr. Korisnik" : "Pacijent")}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isDoctor ? "Lekar specijalista" : "Pacijent"}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Mail size={12} />
                <span>{email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Info (Doctor only) */}
        {isDoctor && (
          <div className="led-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={16} strokeWidth={1.5} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Profesionalni podaci</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Ime i prezime", value: fullName || "—", icon: User },
                { label: "Specijalizacija", value: "Interna medicina", icon: Stethoscope },
                { label: "ID broj lekara", value: "RS-2026-04521", icon: Hash },
                { label: "Ustanova", value: "UKC Srbije, Beograd", icon: Building2 },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <item.icon size={11} />
                    {item.label}
                  </label>
                  <div className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Info */}
        {!isDoctor && (
          <div className="led-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={16} strokeWidth={1.5} className="text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Lični podaci</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Ime i prezime", value: fullName || "—" },
                { label: "JMBG", value: "••••••••••••" },
                { label: "Datum rođenja", value: "01.01.1990." },
                { label: "Kontakt telefon", value: "+381 6x xxx xxxx" },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </label>
                  <div className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="led-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Podešavanja</h3>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe size={16} strokeWidth={1.5} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Jezik</p>
                <p className="text-[10px] text-muted-foreground">Izaberite jezik interfejsa</p>
              </div>
            </div>
            <div className="flex bg-muted/40 rounded-xl p-0.5">
              <button
                onClick={() => setLang("sr")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  lang === "sr" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Srpski
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  lang === "en" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bell size={16} strokeWidth={1.5} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Obaveštenja</p>
                <p className="text-[10px] text-muted-foreground">Primajte notifikacije o novim nalazima</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                notifications ? "bg-accent" : "bg-muted"
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform duration-200 ${
                notifications ? "left-[22px]" : "left-0.5"
              }`} />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-semibold text-destructive bg-destructive/5 border border-destructive/15 hover:bg-destructive/10 active:scale-[0.98] transition-all duration-200"
        >
          <LogOut size={16} strokeWidth={1.8} />
          Odjavi se
        </button>
      </motion.div>
    </DashboardLayout>
  );
}
