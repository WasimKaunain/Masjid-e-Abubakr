import type { Metadata } from "next";
import "./globals.css";
import VisitorTracker from "@/components/visitor-tracker";

export const metadata: Metadata = {
  title: "Masjide AbuBakr",
  description: "Mosque donation dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}
