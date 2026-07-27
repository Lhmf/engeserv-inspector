"use client";

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        role={session?.role || "FUNCIONARIO"} 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={session?.name}
        userEmail={session?.email}
      />
      <div className={cn("flex-1", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <TopBar 
          name={session?.name || "Usuário"} 
          role={session?.role || "FUNCIONARIO"} 
          email={session?.email} 
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}