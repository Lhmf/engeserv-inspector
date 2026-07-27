import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AppLayoutClient } from "./AppLayoutClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <AppLayoutClient
      session={{
        name: session?.name,
        role: session?.role,
        email: session?.email,
      }}
    >
      {children}
    </AppLayoutClient>
  );
}