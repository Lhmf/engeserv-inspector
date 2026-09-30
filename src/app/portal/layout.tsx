import { Metadata } from "next";
import { PortalNavigationClient } from "@/components/portal/PortalNavigationClient";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "EngeServ — Portal do Cliente",
  description: "Portal do Cliente EngeServ — Gestão de inspeções NR-13 e laudos técnicos",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 dark:bg-gray-900">
        <PortalNavigationClient />
        <div className="lg:pl-64 min-h-screen">
          <main className="pt-0 lg:pt-0 min-h-[calc(100vh-4rem)] pb-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}