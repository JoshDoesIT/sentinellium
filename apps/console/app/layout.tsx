import type { Metadata } from "next";
import "./globals.css";
import ShellLayout from "./components/shell-layout";

export const metadata: Metadata = {
  title: "Sentinellium — Enterprise Security Console",
  description:
    "Fleet-wide threat visibility and management for the Sentinellium AI defense grid. Monitor engines, investigate alerts, and manage your security posture.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
