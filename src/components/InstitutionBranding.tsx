import { useState, useEffect, useRef } from "react";
import { Building2, MapPin, Upload, X, Check, Pencil, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface InstitutionData {
  institution_name: string;
  institution_address: string;
  institution_city: string;
  institution_country: string;
  institution_logo_url: string;
}

export default function InstitutionBranding() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<InstitutionData>({
    institution_name: "",
    institution_address: "",
    institution_city: "",
    institution_country: "",
    institution_logo_url: "",
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<InstitutionData>(data);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("institution_name, institution_address, institution_city, institution_country, institution_logo_url")
        .eq("user_id", user.id)
        .single();
      if (profile) {
        const d: InstitutionData = {
          institution_name: profile.institution_name || "",
          institution_address: profile.institution_address || "",
          institution_city: profile.institution_city || "",
          institution_country: (profile as any).institution_country || "",
          institution_logo_url: profile.institution_logo_url || "",
        };
        setData(d);
        setDraft(d);
      }
    };
    load();
  }, []);

  const startEdit = () => {
    setDraft({ ...data });
    setEditing(true);
  };

  const cancel = () => {
    setDraft({ ...data });
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        institution_name: draft.institution_name.trim() || null,
        institution_address: draft.institution_address.trim() || null,
        institution_city: draft.institution_city.trim() || null,
        institution_country: draft.institution_country.trim() || null,
        institution_logo_url: draft.institution_logo_url || null,
      } as any)
      .eq("user_id", user.id);
    if (error) {
      toast.error(t("profile.saveError"));
    } else {
      setData({ ...draft });
      toast.success(t("profile.saveSuccess"));
      setEditing(false);
    }
    setSaving(false);
  };

  const uploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;

    const { error } = await supabase.storage
      .from("institution-logos")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error(t("profile.logoUploadError"));
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("institution-logos")
      .getPublicUrl(path);

    const url = urlData.publicUrl + "?t=" + Date.now();
    setDraft((d) => ({ ...d, institution_logo_url: url }));
    setUploading(false);
  };

  const removeLogo = () => {
    setDraft((d) => ({ ...d, institution_logo_url: "" }));
  };

  const fields = [
    { key: "institution_name" as const, label: t("profile.institutionName"), icon: Building2, placeholder: "Univerzitetski Klinički Centar Srbije" },
    { key: "institution_address" as const, label: t("profile.institutionAddress"), icon: MapPin, placeholder: "Pasterova 2" },
    { key: "institution_city" as const, label: t("profile.institutionCity"), icon: MapPin, placeholder: "Savski venac, 11000 Beograd" },
    { key: "institution_country" as const, label: t("profile.institutionCountry"), icon: MapPin, placeholder: "Republika Srbija" },
  ];

  const logoUrl = editing ? draft.institution_logo_url : data.institution_logo_url;

  return (
    <div className="led-card p-6 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Building2 size={16} strokeWidth={1.5} className="text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {t("profile.institutionBranding")}
          </h3>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
          >
            <Pencil size={11} />
            {t("profile.edit")}
          </button>
        )}
      </div>

      {/* Logo */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ImageIcon size={11} />
          {t("profile.institutionLogo")}
        </label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative group">
              <div className="w-16 h-16 rounded-xl border border-border/50 overflow-hidden bg-muted/20 flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
              {editing && (
                <button
                  onClick={removeLogo}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl border border-dashed border-border/50 bg-muted/10 flex items-center justify-center">
              <Building2 size={20} className="text-muted-foreground/40" />
            </div>
          )}
          {editing && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadLogo(f);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-muted/30 hover:bg-muted/50 text-foreground border border-border/30 transition-colors disabled:opacity-50"
              >
                <Upload size={12} />
                {uploading ? t("profile.uploading") : t("profile.uploadLogo")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.key === "institution_name" ? "sm:col-span-2" : ""}>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <f.icon size={11} />
                {f.label}
              </label>
              {editing ? (
                <input
                  value={draft[f.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground w-full border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                />
              ) : (
                <div className="bg-muted/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground">
                  {data[f.key] || "—"}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={cancel}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
          >
            {t("profile.cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? t("profile.saving") : t("profile.save")}
          </button>
        </div>
      )}
    </div>
  );
}
