"use client";

import { PortalNavigation } from "./PortalNavigation";
import { usePathname } from "next/navigation";

export function PortalNavigationClient() {
  const pathname = usePathname();
  // Hide navigation on login page and its subpaths
  if (pathname.startsWith("/portal/login")) {
    return null;
  }
  return <PortalNavigation />;
}