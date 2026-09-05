import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taletso Digital Communications Platform",
  description: "Enterprise digital signage management for Taletso TVET College",
  icons: { icon: "/taletso-logo.jpg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
