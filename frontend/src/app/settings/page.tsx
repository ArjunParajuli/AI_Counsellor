"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type UserProfile = {
    id: number;
    full_name: string;
    email: string;
    avatar_url: string | null;
};

export default function SettingsPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const token = window.localStorage.getItem("token");
        if (!token) {
            router.replace("/auth/login?next=/settings");
            return;
        }

        async function loadUser() {
            try {
                const res = await fetch(`${API_BASE_URL}/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch {
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, [router]);

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const token = window.localStorage.getItem("token");
        if (!token || !e.target.files?.[0]) return;

        const file = e.target.files[0];
        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;

                const res = await fetch(`${API_BASE_URL}/user/avatar/base64`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ image: base64 }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : null);
                    setSuccess("Avatar updated successfully!");
                    setTimeout(() => setSuccess(null), 3000);
                } else {
                    throw new Error("Upload failed");
                }
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch {
            setError("Failed to upload avatar");
            setUploading(false);
        }
    }

    async function handleRemoveAvatar() {
        const token = window.localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/user/avatar`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setUser((prev) => prev ? { ...prev, avatar_url: null } : null);
                setSuccess("Avatar removed successfully");
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch {
            setError("Failed to remove avatar");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <section className="mx-auto max-w-2xl space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Account Settings</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Personalize your presence and manage your account preferences.
                </p>
            </div>

            {/* Avatar Section */}
            <div className="rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 p-8 shadow-xl hover-lift">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <span className="text-xl">✨</span> Profile Identity
                </h2>

                <div className="flex flex-col sm:flex-row items-center gap-8">
                    {/* Avatar Preview */}
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-2xl animate-pulse-glow">
                            <div className="w-full h-full rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                {user?.avatar_url ? (
                                    <img
                                        src={`${API_BASE_URL}${user.avatar_url}`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-gradient">
                                        {user?.full_name?.charAt(0).toUpperCase() || "?"}
                                    </span>
                                )}
                            </div>
                        </div>
                        {uploading && (
                            <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-indigo-600 dark:text-indigo-400"
                        >
                            📷
                        </button>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3 text-center sm:text-left">
                        <h3 className="font-bold text-slate-900 dark:text-white">Profile Picture</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                            Upload a JPG, PNG, or GIF. Max size 5MB. This will be visible on your profile and to your AI counsellor.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition disabled:opacity-50"
                            >
                                {uploading ? "Uploading..." : "Change Photo"}
                            </button>
                            {user?.avatar_url && (
                                <button
                                    onClick={handleRemoveAvatar}
                                    className="px-6 py-2.5 rounded-full border border-rose-200 dark:border-rose-900/50 text-rose-500 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium animate-fadeIn">
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-fadeIn">
                        ✨ {success}
                    </div>
                )}
            </div>

            {/* Account Info */}
            <div className="rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 p-8 shadow-xl hover-lift animate-fadeInUp stagger-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <span className="text-xl">👤</span> Account Details
                </h2>

                <div className="space-y-6">
                    <div className="group">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1 transition-colors group-hover:text-indigo-500">Full Name</label>
                        <div className="px-5 py-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold transition-all group-hover:border-indigo-500/30">
                            {user?.full_name}
                        </div>
                    </div>
                    <div className="group">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 px-1 transition-colors group-hover:text-indigo-500">Email Address</label>
                        <div className="px-5 py-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold transition-all group-hover:border-indigo-500/30">
                            {user?.email}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2 animate-fadeInUp stagger-2">
                <a
                    href="/onboarding"
                    className="flex items-center gap-4 p-5 rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-500/40 transition-all group hover-lift"
                >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        ✏️
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Refine Goals
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Update budget, exams & more</p>
                    </div>
                </a>

                <a
                    href="/counsellor"
                    className="flex items-center gap-4 p-5 rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-500/40 transition-all group hover-lift"
                >
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🤖
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            Ask Assistant
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Get personalized guidance</p>
                    </div>
                </a>
            </div>

            <div className="pt-4 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-50">
                    AI Counsellor © 2026 • Secure & Encrypted
                </p>
            </div>
        </section>
    );
}
