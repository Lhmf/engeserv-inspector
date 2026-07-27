"use client";

import Link from "next/link";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_MASTER: "Administrador Master",
  GESTOR: "Gestor",
  FUNCIONARIO: "Funcionário",
};

export default function PerfilPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Meu Perfil</h1>
        <p className="text-sm text-slate-500">Gerencie suas informações de conta</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white text-2xl font-bold">
              U
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Usuário Demo</h2>
              <p className="text-slate-500">demo@engeserv.com.br</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
            <p className="text-slate-800">Usuário Demo</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <p className="text-slate-800">demo@engeserv.com.br</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Papel</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy/10 text-navy">
              Funcionário
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Ativo
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Telefone/WhatsApp</label>
            <p className="text-slate-800">Não informado</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Membro desde</label>
            <p className="text-slate-800">-</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <h3 className="font-medium text-slate-800 mb-4">Estatísticas</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-xs text-slate-500">Clientes Responsáveis</p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-xs text-slate-500">Inspeções Realizadas</p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-xs text-slate-500">Inspeções Aprovadas</p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-xs text-slate-500">Fotos Enviadas</p>
            </div>
            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <p className="text-2xl font-bold text-slate-800">0</p>
              <p className="text-xs text-slate-500">Usuários Criados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}