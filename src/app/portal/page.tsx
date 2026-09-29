import { redirect } from "next/navigation";

export default async function PortalHome() {
  redirect("/portal/dashboard");
  return null;
}
