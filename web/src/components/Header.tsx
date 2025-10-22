"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    api("/api/auth/me")
      .then((data) => setMe(data.user))
      .catch(() => setMe(null));
  }, []);

  const handleLogout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navLinkClass = (href: string) => {
    const isActive =
      pathname === href || (href !== "/" && pathname.startsWith(href));
    return isActive
      ? "nav-link active" // orange background
      : "nav-link";       // dark bg + orange text
  };

  return (
    <header className="app-header">
      <div className="logo">Innoclass</div>
      <nav className="nav">
        <Link href="/" className={navLinkClass("/")}>
          Home
        </Link>
        <Link href="/dashboard" className={navLinkClass("/dashboard")}>
          Dashboard
        </Link>
        
      </nav>
    </header>
  );
}
