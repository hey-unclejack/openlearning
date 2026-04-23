import Link from "next/link";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";

export function LanguageSwitcher({ locale, nextPath }: { locale: AppLocale; nextPath: string }) {
  const copy = getLocaleCopy(locale);

  return (
    <div className="language-switcher" aria-label={copy.common.language}>
      <Link
        className={locale === "zh-TW" ? "active" : undefined}
        href={`/locale?lang=zh-TW&next=${encodeURIComponent(nextPath)}`}
      >
        {copy.common.zhTw}
      </Link>
      <Link className={locale === "en" ? "active" : undefined} href={`/locale?lang=en&next=${encodeURIComponent(nextPath)}`}>
        {copy.common.en}
      </Link>
    </div>
  );
}
