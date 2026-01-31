"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useToast } from "@/components/toast-provider";
import StudentLifeInsights from "@/components/student-life-insights";
import InterviewSimulator from "@/components/interview-simulator";

type University = {
    id: number;
    name: string;
    country: string;
    city?: string;
    field_of_study: string;
    degree_level: string;
    tuition_per_year: number;
    cost_level: string;
    competition_level: string;
    base_acceptance_chance: string;
    description?: string;
};

type UserUniversity = {
    id: number;
    category: "dream" | "target" | "safe";
    status: "shortlisted" | "locked";
    acceptance_chance: string;
    fit_reason?: string;
    risk_explanation?: string;
    university: University;
};

export default function UniversityDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();

    const [university, setUniversity] = useState<University | null>(null);
    const [userUni, setUserUni] = useState<UserUniversity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<"overview" | "studentLife" | "interview">("overview");

    useEffect(() => {
        const token = window.localStorage.getItem("token");
        if (!token) {
            router.replace(`/auth/login?next=/universities/${params.id}`);
            return;
        }

        async function load() {
            try {
                // Fetch university details
                const uniRes = await fetch(`${API_BASE_URL}/universities/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!uniRes.ok) {
                    throw new Error("University not found");
                }

                const uniData = await uniRes.json() as University;
                setUniversity(uniData);

                // Check if this university is in user's shortlist
                const mineRes = await fetch(`${API_BASE_URL}/my-universities`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (mineRes.ok) {
                    const mineData = await mineRes.json() as UserUniversity[];
                    const match = mineData.find(u => u.university.id === uniData.id);
                    if (match) {
                        setUserUni(match);
                    }
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [router, params.id]);

    async function handleShortlist(category: "dream" | "target" | "safe") {
        if (!university) return;
        const token = window.localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/universities/${university.id}/shortlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ category }),
        });

        if (res.ok) {
            const data = await res.json() as UserUniversity;
            setUserUni(data);
            showToast(`${university.name} added to ${category.toUpperCase()} list`, "success");
        } else {
            showToast("Failed to shortlist university", "error");
        }
    }

    async function handleLock() {
        if (!userUni) return;
        const token = window.localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/universities/${userUni.id}/lock`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            const data = await res.json() as UserUniversity;
            setUserUni(data);
            showToast(`🔒 ${university?.name} locked!`, "success");
        } else {
            showToast("Failed to lock university", "error");
        }
    }

    async function handleUnlock() {
        if (!userUni) return;
        const token = window.localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/universities/${userUni.id}/unlock`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            const data = await res.json() as UserUniversity;
            setUserUni(data);
            showToast(`🔓 ${university?.name} unlocked`, "info");
        } else {
            showToast("Failed to unlock university", "error");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading university details...</p>
                </div>
            </div>
        );
    }

    if (error || !university) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="text-6xl">🏛️</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">University Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400">{error || "This university doesn't exist."}</p>
                <button
                    onClick={() => router.push("/universities")}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                    Back to Universities
                </button>
            </div>
        );
    }

    const categoryColors = {
        dream: "from-purple-500 to-pink-500",
        target: "from-blue-500 to-cyan-500",
        safe: "from-emerald-500 to-green-500",
    };

    const competitionColors: Record<string, string> = {
        high: "text-rose-500",
        medium: "text-amber-500",
        low: "text-emerald-500",
    };

    return (
        <section className="py-8 animate-fadeIn">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-6"
            >
                <span>←</span> Back
            </button>

            {/* Hero Section */}
            <div className="relative glass-card rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 mb-8">
                <div className={`absolute inset-0 bg-gradient-to-br ${userUni ? categoryColors[userUni.category] : "from-indigo-500 to-purple-600"} opacity-10`}></div>

                <div className="relative p-8">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* University Icon */}
                        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${userUni ? categoryColors[userUni.category] : "from-indigo-500 to-purple-600"} flex items-center justify-center text-5xl text-white shadow-2xl flex-shrink-0`}>
                            🏛️
                        </div>

                        {/* University Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                {userUni && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${categoryColors[userUni.category]}`}>
                                        {userUni.category.toUpperCase()}
                                    </span>
                                )}
                                {userUni?.status === "locked" && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                                        🔒 LOCKED
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                                {university.name}
                            </h1>

                            <p className="text-lg text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                <span>📍</span> {university.city}, {university.country}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            {!userUni ? (
                                <>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Add to shortlist as:</p>
                                    <button
                                        onClick={() => handleShortlist("dream")}
                                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg transition-all"
                                    >
                                        ⭐ Dream School
                                    </button>
                                    <button
                                        onClick={() => handleShortlist("target")}
                                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg transition-all"
                                    >
                                        🎯 Target School
                                    </button>
                                    <button
                                        onClick={() => handleShortlist("safe")}
                                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:shadow-lg transition-all"
                                    >
                                        ✅ Safe School
                                    </button>
                                </>
                            ) : userUni.status === "shortlisted" ? (
                                <button
                                    onClick={handleLock}
                                    className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg transition-all"
                                >
                                    🔒 Lock This University
                                </button>
                            ) : (
                                <button
                                    onClick={handleUnlock}
                                    className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    🔓 Unlock University
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { id: "overview", label: "Overview", icon: "📋" },
                    { id: "studentLife", label: "Student Life", icon: "🏙️" },
                    { id: "interview", label: "Interview Prep", icon: "🎤" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id as typeof activeSection)}
                        className={`px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeSection === tab.id
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                            : "glass-card text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            {activeSection === "overview" && (
                <div className="grid md:grid-cols-2 gap-6 animate-fadeIn">
                    {/* Key Stats */}
                    <div className="glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span>📊</span> Key Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Degree Level</span>
                                <span className="font-bold text-slate-900 dark:text-white capitalize">{university.degree_level}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Field of Study</span>
                                <span className="font-bold text-slate-900 dark:text-white">{university.field_of_study}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Tuition per Year</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">${university.tuition_per_year.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Cost Level</span>
                                <span className={`font-bold capitalize ${university.cost_level === "high" ? "text-rose-500" : university.cost_level === "medium" ? "text-amber-500" : "text-emerald-500"}`}>
                                    {university.cost_level}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Competition Level</span>
                                <span className={`font-bold capitalize ${competitionColors[university.competition_level] || ""}`}>
                                    {university.competition_level}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-slate-500 dark:text-slate-400">Acceptance Chance</span>
                                <span className={`font-bold capitalize ${university.base_acceptance_chance === "high" ? "text-emerald-500" :
                                    university.base_acceptance_chance === "medium" ? "text-amber-500" : "text-rose-500"
                                    }`}>
                                    {university.base_acceptance_chance}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description & Fit */}
                    <div className="space-y-6">
                        {university.description && (
                            <div className="glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span>📝</span> About
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {university.description}
                                </p>
                            </div>
                        )}

                        {userUni?.fit_reason && (
                            <div className="glass-card rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-700/50 bg-indigo-50/50 dark:bg-indigo-950/30">
                                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mb-3 flex items-center gap-2">
                                    <span>💡</span> Why This Fits You
                                </h3>
                                <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                    {userUni.fit_reason}
                                </p>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span>⚡</span> Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => router.push(`/counsellor?university=${encodeURIComponent(university.name)}&id=${university.id}`)}
                                    className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-200/50 dark:border-violet-700/50 hover:shadow-lg transition-all text-left"
                                >
                                    <span className="text-2xl mb-2 block">🤖</span>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">Ask AI Counsellor</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Get advice about this school</p>
                                </button>
                                <button
                                    onClick={() => router.push("/applications")}
                                    className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-lg transition-all text-left"
                                >
                                    <span className="text-2xl mb-2 block">📝</span>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">View Applications</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Track your progress</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === "studentLife" && (
                <div className="animate-fadeIn">
                    <StudentLifeInsights
                        universityId={university.id}
                        universityName={university.name}
                        city={university.city || ""}
                        country={university.country}
                    />
                </div>
            )}

            {activeSection === "interview" && (
                <div className="glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 animate-fadeIn">
                    <InterviewSimulator
                        universityId={university.id}
                        universityName={university.name}
                        country={university.country}
                        program={university.field_of_study}
                        onClose={() => setActiveSection("overview")}
                    />
                </div>
            )}
        </section>
    );
}
