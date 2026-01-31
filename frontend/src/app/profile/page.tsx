"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type ExamStatus = "not_started" | "in_progress" | "completed";
type SopStatus = "not_started" | "draft" | "ready";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [currentEducationLevel, setCurrentEducationLevel] = useState("");
    const [degreeMajor, setDegreeMajor] = useState("");
    const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
    const [gpa, setGpa] = useState("");

    const [intendedDegree, setIntendedDegree] = useState("masters");
    const [fieldOfStudy, setFieldOfStudy] = useState("");
    const [targetIntakeYear, setTargetIntakeYear] = useState(
        new Date().getFullYear() + 1
    );
    const [preferredCountries, setPreferredCountries] = useState<string>("Canada,United States");

    const [budgetPerYear, setBudgetPerYear] = useState(25000);
    const [fundingPlan, setFundingPlan] = useState("self-funded");

    const [ieltsToeflStatus, setIeltsToeflStatus] =
        useState<ExamStatus>("not_started");
    const [greGmatStatus, setGreGmatStatus] = useState<ExamStatus>("not_started");
    const [sopStatus, setSopStatus] = useState<SopStatus>("not_started");

    useEffect(() => {
        const token = window.localStorage.getItem("token");
        if (!token) {
            router.replace("/auth/login?next=/profile");
            return;
        }

        async function loadProfile() {
            try {
                const res = await fetch(`${API_BASE_URL}/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setCurrentEducationLevel(data.current_education_level);
                    setDegreeMajor(data.degree_major);
                    setGraduationYear(data.graduation_year);
                    setGpa(data.gpa ?? "");
                    setIntendedDegree(data.intended_degree);
                    setFieldOfStudy(data.field_of_study);
                    setTargetIntakeYear(data.target_intake_year);
                    setPreferredCountries(data.preferred_countries.join(","));
                    setBudgetPerYear(data.budget_per_year);
                    setFundingPlan(data.funding_plan);
                    setIeltsToeflStatus(data.ielts_toefl_status);
                    setGreGmatStatus(data.gre_gmat_status);
                    setSopStatus(data.sop_status);
                } else if (res.status === 404) {
                    router.replace("/onboarding");
                }
            } catch {
                // Ignore
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [router]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setSaving(true);
        const token = window.localStorage.getItem("token");
        if (!token) {
            router.replace("/auth/login?next=/profile");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    current_education_level: currentEducationLevel,
                    degree_major: degreeMajor,
                    graduation_year: graduationYear,
                    gpa: gpa ? Number(gpa) : null,
                    intended_degree: intendedDegree,
                    field_of_study: fieldOfStudy,
                    target_intake_year: targetIntakeYear,
                    preferred_countries: preferredCountries
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean),
                    budget_per_year: budgetPerYear,
                    funding_plan: fundingPlan,
                    ielts_toefl_status: ieltsToeflStatus,
                    gre_gmat_status: greGmatStatus,
                    sop_status: sopStatus,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to save profile");
            }
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
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
        <section className="mx-auto max-w-3xl space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Your Study Profile</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Manage your targets, academic background, and financial plan to get better recommendations.
                    </p>
                </div>
                <a
                    href="/dashboard"
                    className="px-6 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-center"
                >
                    Back to Dashboard
                </a>
            </div>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-4 text-xs font-medium text-amber-700 dark:text-amber-300 animate-pulse-soft">
                💡 <strong>Important Note:</strong> Editing your profile will trigger a re-analysis of your university matches and AI-generated roadmaps.
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Academic Background */}
                <div className="space-y-4 rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl hover-lift">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="text-xl">🎓</span> Academic Background
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Current education level
                            </label>
                            <input
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                value={currentEducationLevel}
                                onChange={(e) => setCurrentEducationLevel(e.target.value)}
                                placeholder="e.g., Bachelor's final year"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Degree / major
                            </label>
                            <input
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                value={degreeMajor}
                                onChange={(e) => setDegreeMajor(e.target.value)}
                                placeholder="e.g., B.Tech in CSE"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Graduation year
                            </label>
                            <input
                                type="number"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                GPA / percentage
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                value={gpa}
                                onChange={(e) => setGpa(e.target.value)}
                                placeholder="e.g., 8.2"
                            />
                        </div>
                    </div>
                </div>

                {/* Study Goal */}
                <div className="space-y-4 rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl hover-lift animate-fadeInUp stagger-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="text-xl">🎯</span> Study Goal
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Intended degree
                            </label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
                                value={intendedDegree}
                                onChange={(e) => setIntendedDegree(e.target.value)}
                            >
                                <option value="bachelors">Bachelor&apos;s</option>
                                <option value="masters">Master&apos;s</option>
                                <option value="mba">MBA</option>
                                <option value="phd">PhD</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Field of study
                            </label>
                            <input
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                value={fieldOfStudy}
                                onChange={(e) => setFieldOfStudy(e.target.value)}
                                placeholder="e.g., Computer Science"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Target intake year
                            </label>
                            <input
                                type="number"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                value={targetIntakeYear}
                                onChange={(e) => setTargetIntakeYear(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Preferred countries (comma separated)
                            </label>
                            <input
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                value={preferredCountries}
                                onChange={(e) => setPreferredCountries(e.target.value)}
                                required
                                placeholder="e.g., USA, UK, Canada"
                            />
                        </div>
                    </div>
                </div>

                {/* Budget */}
                <div className="space-y-4 rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl hover-lift animate-fadeInUp stagger-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-100 flex items-center gap-2">
                        <span className="text-xl">💰</span> Budget & Funding
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Budget per year (USD)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 pl-8 pr-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    value={budgetPerYear}
                                    onChange={(e) => setBudgetPerYear(Number(e.target.value))}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Funding plan
                            </label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
                                value={fundingPlan}
                                onChange={(e) => setFundingPlan(e.target.value)}
                            >
                                <option value="self-funded">Self-funded</option>
                                <option value="scholarship-dependent">Scholarship-dependent</option>
                                <option value="loan-dependent">Loan-dependent</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Exams & Readiness */}
                <div className="space-y-4 rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl hover-lift animate-fadeInUp stagger-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="text-xl">⚡</span> Preparation Status
                    </h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                IELTS / TOEFL
                            </label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
                                value={ieltsToeflStatus}
                                onChange={(e) =>
                                    setIeltsToeflStatus(e.target.value as ExamStatus)
                                }
                            >
                                <option value="not_started">Not started</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                GRE / GMAT
                            </label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
                                value={greGmatStatus}
                                onChange={(e) =>
                                    setGreGmatStatus(e.target.value as ExamStatus)
                                }
                            >
                                <option value="not_started">Not started</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                SOP status
                            </label>
                            <select
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer"
                                value={sopStatus}
                                onChange={(e) => setSopStatus(e.target.value as SopStatus)}
                            >
                                <option value="not_started">Not started</option>
                                <option value="draft">Draft</option>
                                <option value="ready">Ready</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium animate-fadeIn">
                        ⚠️ {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold text-center animate-fadeIn">
                        ✨ Profile successfully updated! We're recalibrating your roadmap.
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all disabled:opacity-60 active:scale-95"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving Changes...
                            </span>
                        ) : (
                            "Sync Profile"
                        )}
                    </button>
                </div>
            </form>
        </section>
    );
}
