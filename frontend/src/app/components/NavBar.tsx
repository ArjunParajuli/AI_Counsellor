"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

type NavLink = {
    href: string;
    label: string;
    icon?: string;
    requiresAuth: boolean;
};

type UserInfo = {
    full_name: string;
    avatar_url: string | null;
};

const navLinks: NavLink[] = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", requiresAuth: true },
    { href: "/universities", label: "Universities", icon: "🎓", requiresAuth: true },
    { href: "/counsellor", label: "AI Counsellor", icon: "🤖", requiresAuth: true },
    { href: "/applications", label: "Applications", icon: "📝", requiresAuth: true },
];

export default function NavBar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        setMounted(true);
        const token = window.localStorage.getItem("token");
        setIsLoggedIn(!!token);

        if (token) {
            fetch(`${API_BASE_URL}/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.ok ? res.json() : null)
                .then((data) => {
                    if (data) setUser(data);
                })
                .catch(() => { });
        }
    }, []);

    useEffect(() => {
        const token = window.localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, [pathname]);

    function handleLogout() {
        window.localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUser(null);
        router.push("/");
    }

    if (!mounted) {
        return (
            <nav className="flex items-center gap-4">
                <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </nav>
        );
    }

    const isAuthPage = pathname?.startsWith("/auth");
    const isLanding = pathname === "/";
    const isOnboarding = pathname === "/onboarding";

    // On onboarding page, show minimal nav (just theme toggle)
    if (isOnboarding) {
        return (
            <nav className="flex items-center gap-3">
                <ThemeToggle />
            </nav>
        );
    }

    if (isLanding || isAuthPage) {
        return (
            <nav className="flex items-center gap-3">
                <ThemeToggle />
                <a
                    href="/auth/login"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                    Sign in
                </a>
                <a
                    href="/auth/signup"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-105"
                >
                    Get Started
                </a>
            </nav>
        );
    }

    return (
        <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
                if (link.requiresAuth && !isLoggedIn) return null;
                const isActive = pathname === link.href;
                return (
                    <a
                        key={link.href}
                        href={link.href}
                        className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 group ${isActive
                            ? "bg-indigo-500/20 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        <span className="hidden sm:inline text-sm">{link.icon}</span>
                        {link.label}
                        {isActive && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                        )}
                    </a>
                );
            })}

            {/* Theme Toggle */}
            <div className="ml-2">
                <ThemeToggle />
            </div>

            {isLoggedIn && (
                <div className="relative ml-1">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/50 px-1 py-1 pr-3 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition group"
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden text-xs font-bold text-white ring-2 ring-white dark:ring-slate-950 shadow-lg">
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE_URL}${user.avatar_url}`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>{user?.full_name?.charAt(0).toUpperCase() || "?"}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950" />
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline group-hover:text-slate-900 dark:group-hover:text-white transition">
                            {user?.full_name?.split(" ")[0] || "Account"}
                        </span>
                        <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowDropdown(false)}
                            ></div>
                            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl z-20 py-2 overflow-hidden animate-scaleIn">
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.full_name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account</p>
                                </div>

                                <div className="py-1">
                                    <a
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
                                    >
                                        <span className="text-lg">📋</span>
                                        <div>
                                            <p className="font-medium">Study Profile</p>
                                            <p className="text-xs text-slate-400">View your progress</p>
                                        </div>
                                    </a>
                                    <a
                                        href="/settings"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
                                    >
                                        <span className="text-lg">⚙️</span>
                                        <div>
                                            <p className="font-medium">Settings</p>
                                            <p className="text-xs text-slate-400">Account preferences</p>
                                        </div>
                                    </a>
                                    <a
                                        href="/onboarding"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
                                    >
                                        <span className="text-lg">✏️</span>
                                        <div>
                                            <p className="font-medium">Edit Preferences</p>
                                            <p className="text-xs text-slate-400">Update your goals</p>
                                        </div>
                                    </a>
                                </div>

                                <div className="border-t border-slate-100 dark:border-white/10 mt-1 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                                    >
                                        <span className="text-lg">🚪</span>
                                        <p className="font-medium">Sign Out</p>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
