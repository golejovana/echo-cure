import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import EchoMedChat from "@/components/EchoMedChat";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  role: "doctor" | "patient";
  children: React.ReactNode;
}

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Refined header with gradient accent line */}
          <header className="h-14 flex items-center border-b border-border/30 px-5 bg-card/60 backdrop-blur-xl relative">
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <SidebarTrigger className="mr-4 text-muted-foreground hover:text-foreground transition-colors" />
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Echo<span className="gradient-text">Cure</span>
            </h1>
            {/* Subtle activity indicator */}
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent pulse-soft" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Online</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
