import type { Metadata } from "next";
import "@/app/globals.css";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "OpenLearning",
  description: "SRS-first personal learning assistant"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);

  return (
    <html lang={copy.htmlLang}>
      <body>{children}</body>
    </html>
  );
}
