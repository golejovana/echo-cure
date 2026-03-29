import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Settings, Globe, Bell, LogOut,
  Stethoscope, Building2, Hash, Camera, HeartPulse, Mail, Pencil, Check, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useTranslation } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import InstitutionBranding from "@/components/InstitutionBranding";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function ProfilePage() {
  const { t } = useTranslation();
  const [role, setRole] = useState<AppRole>("doctor");
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("profiles").update({ full_name: editName.trim() }).eq("user_id", user.id);
      if (error) {
        toast.error(t("profile.saveError"));
      } else {
        setFullName(editName.trim());
        toast.success(t("profile.saveSuccess"));
        setEditing(false);
      }
    }
    setSaving(false);
  };

  const startEditing = () => {
    setEditName(fullName);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditName("");
  };

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
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Profile Header */}
        <div className="led-card p-6">
          <div className="flex items-start gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0 shadow-inner">
                {isDoctor ? <Stethoscope size={32} strokeWidth={1.2} className="text-primary" /> : <HeartPulse size={32} strokeWidth={1.2} className="text-accent" />}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow opacity-0 group-hover:opacity-100 duration-200">
                <Camera size={12} strokeWidth={1.8} className="text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-lg font-semibold text-foreground bg-muted/30 rounded-xl px-3 py-1.5 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  />
                  <button onClick={handleSave} disabled={saving} className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Check size={14} className="text-primary" />
                  </button>
                  <button onClick={cancelEditing} className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/name">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {fullName || (isDoctor ? t("profile.doctorDefault") : t("profile.patientRole"))}
                  </h2>
                  <button onClick={startEditing} className="w-6 h-6 rounded-full hover:bg-muted/50 flex items-center justify-center opacity-0 group-hover/name:opacity-100 transition-opacity">
                    <Pencil size={12} className="text-muted-foreground" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                {isDoctor ? t("profile.specialist") : t("profile.patientRole")}
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
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <User size={16} strokeWidth={1.5} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("profile.professionalData")}</h3>
              </div>
              {!editing && (
                <button onClick={startEditing} className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
                  <Pencil size={11} />
                  {t("profile.edit")}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: t("profile.name"), value: fullName || "—", icon: User, editable: true },
                { label: t("profile.specialization"), value: t("profile.internalMedicine"), icon: Stethoscope },
                { label: t("profile.doctorId"), value: "RS-2026-04521", icon: Hash },
                { label: t("profile.institution"), value: t("profile.institutionValue"), icon: Building2 },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <item.icon size={11} />
                    {item.label}
                  </label>
                  {editing && item.editable ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground w-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                  ) : (
                    <div className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground">{item.value}</div>
                  )}
                </div>
              ))}
            </div>
            {editing && (
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={cancelEditing} className="px-4 py-2 text-xs font-medium rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
                  {t("profile.cancel")}
                </button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? t("profile.saving") : t("profile.save")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Patient Info */}
        {!isDoctor && (
          <div className="led-card p-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <User size={16} strokeWidth={1.5} className="text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("profile.personalData")}</h3>
              </div>
              {!editing && (
                <button onClick={startEditing} className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
                  <Pencil size={11} />
                  {t("profile.edit")}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: t("profile.name"), value: fullName || "—", editable: true },
                { label: t("profile.jmbg"), value: "••••••••••••" },
                { label: t("profile.birthDate"), value: "01.01.1990." },
                { label: t("profile.phone"), value: "+381 6x xxx xxxx" },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</label>
                  {editing && item.editable ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground w-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />
                  ) : (
                    <div className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground">{item.value}</div>
                  )}
                </div>
              ))}
            </div>
            {editing && (
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={cancelEditing} className="px-4 py-2 text-xs font-medium rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
                  {t("profile.cancel")}
                </button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? t("profile.saving") : t("profile.save")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="led-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t("profile.settings")}</h3>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe size={16} strokeWidth={1.5} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t("profile.language")}</p>
                <p className="text-[10px] text-muted-foreground">{t("profile.languageDesc")}</p>
              </div>
            </div>
            <LanguageSelector variant="compact" />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bell size={16} strokeWidth={1.5} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t("profile.notifications")}</p>
                <p className="text-[10px] text-muted-foreground">{t("profile.notificationsDesc")}</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifications ? "bg-accent" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform duration-200 ${notifications ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-semibold text-destructive bg-destructive/5 border border-destructive/15 hover:bg-destructive/10 active:scale-[0.98] transition-all duration-200"
        >
          <LogOut size={16} strokeWidth={1.8} />
          {t("profile.logout")}
        </button>
      </motion.div>
    </DashboardLayout>
  );
}
