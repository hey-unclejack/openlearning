import type { Route } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";

const links: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/study/today", label: "Today" },
  { href: "/study/review", label: "Review" },
  { href: "/progress", label: "Progress" },
  { href: "/onboarding", label: "Profile" }
];

export function AppShell({
  children,
  activePath,
  userEmail
}: {
  children: ReactNode;
  activePath: Route;
  userEmail?: string;
}) {
  return (
    <div className="app-shell shell">
      <div className="site-header">
        <div className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark" />
            OpenLearning
          </Link>
          <div className="nav-links">
            {userEmail ? <span>{userEmail}</span> : <span>SRS-first language coach</span>}
            {userEmail ? <SignOutButton /> : null}
          </div>
        </div>
      </div>
      <div className="app-grid">
        <aside className="sidebar">
          <div className="eyebrow">Learning Loop</div>
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
