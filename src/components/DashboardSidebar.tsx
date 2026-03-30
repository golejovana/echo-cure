import { Home, History, User, LogOut, Stethoscope, HeartPulse, Sparkles, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";
import echocureLogo from "@/assets/echocure-logo.png";
import LanguageSelector from "@/components/LanguageSelector";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  role: "doctor" | "patient";
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { t } = useTranslation();

  const doctorNav = [
    { title: t("nav.dashboard"), url: "/", icon: Home },
    { title: t("nav.examination"), url: "/examination", icon: Stethoscope },
    { title: t("nav.history"), url: "/history", icon: History },
    { title: t("nav.profile"), url: "/profile", icon: User },
  ];

  const patientNav = [
    { title: t("nav.dashboard"), url: "/", icon: Home },
    { title: t("nav.history"), url: "/history", icon: History },
    { title: t("nav.profile"), url: "/profile", icon: User },
  ];

  const items = role === "doctor" ? doctorNav : patientNav;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30 bg-card/50 backdrop-blur-xl">
      {/* Logo + Role badge */}
      <div className="p-4 flex items-center gap-3 border-b border-border/20 relative">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-primary/20 via-transparent to-accent/20" />
        <img src={echocureLogo} alt="EchoCure" className="h-8 w-auto" />
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15">
            {role === "doctor" ? (
              <Stethoscope size={12} className="text-primary" />
            ) : (
              <HeartPulse size={12} className="text-accent" />
            )}
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
              {role === "doctor" ? t("nav.doctor") : t("nav.patient")}
            </span>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 px-3">
            {t("nav.navigation")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-primary/5 rounded-xl mx-1 transition-all duration-200 group"
                      activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
                    >
                      <item.icon className="mr-2.5 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI badge */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="mx-3 p-3 rounded-xl bg-gradient-to-br from-primary/8 to-accent/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Powered</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Klinička AI podrška aktivna
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Language selector */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <LanguageSelector variant="compact" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/20 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-muted-foreground hover:bg-destructive/8 hover:text-destructive rounded-xl mx-1 transition-all duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span className="text-sm">{t("nav.logout")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
