import type { Route } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";

export function AppShell({
  children,
  activePath,
  userEmail,
  locale
}: {
  children: ReactNode;
  activePath: Route;
  userEmail?: string;
  locale: AppLocale;
}) {
  const copy = getLocaleCopy(locale);
  const links: Array<{ href: Route; label: string }> = [
    { href: "/dashboard", label: copy.appShell.nav.dashboard },
    { href: "/study/today", label: copy.appShell.nav.today },
    { href: "/study/review", label: copy.appShell.nav.review },
    { href: "/progress", label: copy.appShell.nav.progress },
    { href: "/onboarding", label: copy.appShell.nav.profile }
  ];

  return (
    <div className="app-shell shell">
      <div className="site-header">
        <div className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark" />
            OpenLearning
          </Link>
          <div className="nav-links">
            {userEmail ? <span>{userEmail}</span> : <span>{copy.appShell.tagline}</span>}
            {userEmail ? <SignOutButton locale={locale} /> : null}
          </div>
        </div>
      </div>
      <div className="app-grid">
        <aside className="sidebar">
          <div className="eyebrow">{copy.appShell.learningLoop}</div>
          <nav>
            {links.map((link) => (
              <Link key={link.href} href={link.href} data-active={activePath === link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="content-panel">{children}</main>
      </div>
    </div>
  );
}
