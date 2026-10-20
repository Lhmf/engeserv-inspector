import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "EngeServ — Login",
  description: "Login no Portal do Cliente EngeServ",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  // A navegação lateral não é renderizada em /portal/login — sem reserva lg:pl-64
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <main className="min-h-screen pb-8">
        {children}
      </main>
    </div>
  );
}