import { Shield } from "lucide-react";

const TopNav = () => (
  <nav className="flex items-center justify-between px-8 py-5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-primary-foreground text-sm font-bold tracking-tight">E</span>
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        EchoMed <span className="font-light text-muted-foreground">AI</span>
      </span>
    </div>
    <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-[0.97]">
      <Shield size={18} strokeWidth={1.5} />
      <span className="hidden sm:inline font-medium">GDPR Compliant</span>
    </button>
  </nav>
);

export default TopNav;
