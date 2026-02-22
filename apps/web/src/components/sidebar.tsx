"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    Image,
    LogOut,
    GraduationCap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/subjects", label: "Subjects", icon: BookOpen },
    { href: "/notes", label: "Notes", icon: Image },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-64 flex-col border-r border-surface-border bg-surface-raised">
            {/* Brand */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <GraduationCap size={20} />
                </div>
                <span className="text-lg font-bold tracking-tight text-text-primary">
                    SnapStudy
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
                                ${active
                                    ? "bg-brand-600/15 text-brand-400"
                                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                                }`}
                        >
                            <Icon size={18} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="border-t border-surface-border px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                            {user?.display_name ?? "—"}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                            {user?.email ?? ""}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="ml-2 rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-danger"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
