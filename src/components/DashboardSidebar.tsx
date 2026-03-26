import { Home, History, User, LogOut, Stethoscope, HeartPulse } from "lucide-react";
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
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <div className="p-4 flex items-center gap-2.5 border-b border-border/30">
        <img src={echocureLogo} alt="EchoCure" className="h-8 w-auto" />
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            {role === "doctor" ? (
              <Stethoscope size={14} className="text-primary" />
            ) : (
              <HeartPulse size={14} className="text-accent" />
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {role === "doctor" ? t("nav.doctor") : t("nav.patient")}
            </span>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Language selector in sidebar */}
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

      <SidebarFooter className="border-t border-border/30 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>{t("nav.logout")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
