import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/LanguageContext";
import echocureLogo from "@/assets/echocure-logo.png";
import { Mail, Lock, Eye, EyeOff, User, CheckCircle2, AlertCircle, Stethoscope, HeartPulse } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";

type Role = "doctor" | "patient";

const Auth = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("doctor");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.loginError"), description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const handleSignup = async () => {
    if (!passwordsMatch) {
      toast({ title: t("auth.passwordMismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.signupError"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.signupSuccess"), description: t("auth.checkEmail") });
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: t("auth.googleError"), description: String(error), variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isLogin ? handleLogin() : handleSignup();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(200,30%,95%)] via-background to-[hsl(180,20%,94%)] relative overflow-hidden">
      <HeartPulse className="absolute top-[10%] left-[5%] text-primary/[0.06] w-32 h-32 -rotate-12" />
      <Stethoscope className="absolute bottom-[8%] right-[6%] text-primary/[0.06] w-40 h-40 rotate-12" />
      <HeartPulse className="absolute top-[60%] left-[80%] text-accent/[0.05] w-24 h-24 rotate-45" />
      <Stethoscope className="absolute top-[5%] right-[20%] text-accent/[0.05] w-28 h-28 -rotate-6" />

      {/* Language selector top-right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector variant="minimal" />
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="flex justify-center mb-8">
          <img src={echocureLogo} alt="EchoCure" className="h-14 w-auto" />
        </div>

        <div className="glass-card-elevated p-8 sm:p-10">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {isLogin ? t("auth.login") : t("auth.signup")}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {isLogin ? t("auth.welcomeBack") : t("auth.signupSubtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{t("auth.registerAs")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "doctor" as Role, label: t("auth.doctor"), icon: Stethoscope },
                    { value: "patient" as Role, label: t("auth.patient"), icon: User },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                        role === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <opt.icon size={18} />
                      {opt.label}
                      {role === opt.value && <CheckCircle2 size={16} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium">{t("auth.fullName")}</Label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("auth.fullNamePlaceholder")} className="pl-10" required />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">{t("auth.email")}</Label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder={t("auth.emailPlaceholder")}
                  className={`pl-10 pr-10 ${emailTouched ? (isValidEmail ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                  required
                />
                {emailTouched && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidEmail ? <CheckCircle2 size={18} className="text-green-500" /> : <AlertCircle size={18} className="text-destructive" />}
                  </div>
                )}
              </div>
              {emailTouched && !isValidEmail && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle size={12} /> {t("auth.invalidEmail")}</p>
              )}
              {emailTouched && isValidEmail && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle2 size={12} /> {t("auth.validEmail")}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">{t("auth.password")}</Label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className={`pl-10 pr-10 ${passwordTouched ? (isPasswordValid ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordTouched && !isPasswordValid && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle size={12} /> {t("auth.passwordMin")}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("auth.confirmPasswordPlaceholder")} className={`pl-10 ${confirmPassword && !passwordsMatch ? "border-destructive" : ""}`} required />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle size={12} /> {t("auth.passwordMismatch")}</p>
                )}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-md transition-all duration-200">
              {loading ? t("auth.loading") : isLogin ? t("auth.login") : t("auth.signup")}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("auth.or")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleLogin} className="w-full h-12 rounded-xl font-medium text-sm gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t("auth.googleLogin")}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setEmailTouched(false); setPasswordTouched(false); }} className="text-primary font-semibold hover:underline">
              {isLogin ? t("auth.signup") : t("auth.login")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
