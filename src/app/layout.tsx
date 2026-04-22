import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "OpenLearning",
  description: "SRS-first language learning assistant"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
