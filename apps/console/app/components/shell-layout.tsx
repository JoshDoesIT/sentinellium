"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";

/**
 * @module ShellLayout
 * @description Conditional layout shell — shows sidebar for authenticated
 * pages, hides it for the login page.
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__main">{children}</main>
    </div>
  );
}
