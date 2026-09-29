import "../globals.css";

export const metadata = {
  title: "EngeServ — Portal do Cliente",
  description: "Portal do Cliente EngeServ — Gestão de inspeções NR-13 e laudos técnicos",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white dark:bg-gray-800">{children}</body>
    </html>
  );
}
