import { Home, History, User, LogOut, Stethoscope, HeartPulse } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import echocureLogo from "@/assets/echocure-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const doctorNav = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Pregled", url: "/examination", icon: Stethoscope },
  { title: "Istorija", url: "/history", icon: History },
  { title: "Profil", url: "/profile", icon: User },
];

const patientNav = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Istorija", url: "/history", icon: History },
  { title: "Profil", url: "/profile", icon: User },
];

interface DashboardSidebarProps {
  role: "doctor" | "patient";
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
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
              {role === "doctor" ? "Doktor" : "Pacijent"}
            </span>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigacija</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Odjavi se</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
