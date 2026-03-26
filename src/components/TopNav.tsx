import { Shield } from "lucide-react";
import echocureLogo from "@/assets/echocure-logo.png";
import { useTranslation } from "@/i18n/LanguageContext";

const TopNav = () => {
  const { t } = useTranslation();
  return (
    <nav className="flex items-center justify-between px-8 py-5">
      <div className="flex items-center gap-2.5">
        <img src={echocureLogo} alt="EchoCure" className="h-10 w-auto" />
      </div>
      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-[0.97]">
        <Shield size={18} strokeWidth={1.5} />
        <span className="hidden sm:inline font-medium">{t("topnav.gdpr")}</span>
      </button>
    </nav>
  );
};

export default TopNav;
