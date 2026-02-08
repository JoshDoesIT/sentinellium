"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

/**
 * @module Sidebar
 * @description Persistent navigation shell with Option D monochrome logo,
 * brand wordmark, and icon-labeled navigation links.
 */

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: "⊞" },
  { href: "/alerts", label: "Alerts", icon: "⚠" },
  { href: "/fleet", label: "Fleet", icon: "◉" },
  { href: "/timeline", label: "Timeline", icon: "〰" },
  { href: "/geo", label: "Geo Map", icon: "⊕" },
  { href: "/audit", label: "Audit Log", icon: "☰" },
  { href: "/users", label: "Users", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar__header">
        <Image
          src="/logo.png"
          alt="Sentinellium"
          width={36}
          height={36}
          className="sidebar__logo"
          priority
        />
        <span className="sidebar__wordmark">Sentinellium</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__version">v0.1.0</span>
      </div>
    </aside>
  );
}
