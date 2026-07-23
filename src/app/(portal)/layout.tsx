import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <><Sidebar/><div className="portal-main min-h-screen lg:ml-64"><Topbar/><main>{children}</main></div></>;
}
