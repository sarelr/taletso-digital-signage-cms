import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  return <><Sidebar/><div className="portal-main min-h-screen lg:ml-64"><Topbar/><main>{children}</main></div></>;
}
