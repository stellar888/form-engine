import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astrokarma Oracle Daily",
  description: "Daily oracle reading with cosmic guidance."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
