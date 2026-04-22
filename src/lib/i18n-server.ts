import { cookies, headers } from "next/headers";
import { AppLocale, LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";

export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  if (cookieLocale) {
    return resolveLocale(cookieLocale);
  }

  const headerStore = await headers();
  return resolveLocale(headerStore.get("accept-language"));
}
