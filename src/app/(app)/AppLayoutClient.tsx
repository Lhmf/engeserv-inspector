"use client";

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { initOfflineDetection } from "@/lib/offline";

type Role = "ADMIN_MASTER" | "GESTOR" | "FUNCIONARIO";

interface AppLayoutClientProps {
  session: {
    name?: string;
    role?: Role;
    email?: string;
  };
  children: React.ReactNode;
}

export function AppLayoutClient({ session, children }: AppLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer when resizing up to tablet/desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Wire offline detection + queue flush on connection return
  useEffect(() => {
    initOfflineDetection();
  }, []);

  return (
    <div className="min-h-screen bg-base flex">
      <Sidebar
        role={session?.role || "FUNCIONARIO"}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setMobileOpen(false)}
        userName={session?.name}
        userEmail={session?.email}
      />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "flex-1 min-w-0",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <TopBar
          name={session?.name || "Usuário"}
          role={session.role || "FUNCIONARIO"}
          email={session?.email}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />
        <main className="p-4 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  );
}