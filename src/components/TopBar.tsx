"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ChevronDown, Menu, X, Bell, Moon, Sun, Settings } from "lucide-react";
import { useState, useEffect } from "react";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_MASTER: "Administrador Master",
  GESTOR: "Gestor",
  FUNCIONARIO: "Funcionário",
};

export function TopBar({ name, role, email, sidebarCollapsed, onToggleSidebar }: { 
  name: string; 
  role: string; 
  email?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setDarkMode(true);
    }
  }, []);

  const notifications = [
    { id: 1, title: "Nova inspeção agendada", description: "V-101 - Petrobras", time: "10 min", unread: true },
    { id: 2, title: "Laudo aprovado", description: "C-201 - Vale", time: "2h", unread: true },
    { id: 3, title: "Equipamento crítico", description: "V-401 - Espessura abaixo do mínimo", time: "1 dia", unread: false },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Colapsar menu lateral"}
        >
          {sidebarCollapsed ? <ChevronDown className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>

        <div className="hidden sm:flex sm:items-center sm:gap-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-xs font-medium text-slate-600">EngeServ Inspector</span>
          <span className="w-px h-5 bg-slate-200 mx-2" />
          <span className="text-xs text-slate-500">MVP 1.0</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => n.unread) && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Notificações</h3>
                <button className="text-xs text-slate-500 hover:text-slate-700">Marcar todas como lidas</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn("px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0", notif.unread && "bg-blue-50/50")}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-2 h-2 mt-2 rounded-full flex-shrink-0", notif.unread ? "bg-navy" : "bg-slate-300")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium text-slate-800", notif.unread && "font-semibold")}>{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{notif.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-200">
                <Link href="/notificacoes" className="block text-center text-sm text-navy hover:text-brand font-medium">
                  Ver todas as notificações
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => { setDarkMode(!darkMode); document.documentElement.classList.toggle("dark"); }}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={darkMode ? "Modo claro" : "Modo escuro"}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotificationsOpen(false); }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Menu do usuário"
            aria-expanded={userMenuOpen}
          >
            <UserAvatar name={name} email={email} size="sm" showStatus status="online" />
            <span className="hidden sm:block text-sm font-medium text-slate-700 truncate max-w-[140px]">{name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="font-medium text-slate-800">{name}</p>
                <p className="text-xs text-slate-500">{email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium bg-navy/10 text-navy rounded-full">
                  {ROLE_LABEL[role] ?? role}
                </span>
              </div>
              <nav className="py-1">
                <Link href="/perfil" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Perfil
                </Link>
                <Link href="/configuracoes" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                  <Settings className="w-4 h-4" />
                  Configurações
                </Link>
                <hr className="my-1 border-slate-200" />
                <LogoutButton className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors bg-transparent border-none cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sair
                </LogoutButton>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}