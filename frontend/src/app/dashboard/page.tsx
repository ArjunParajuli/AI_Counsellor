"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type Stage =
  | "building_profile"
  | "discovering_universities"
  | "finalizing_universities"
  | "preparing_applications";

type Profile = {
  current_education_level: string;
  degree_major: string;
  graduation_year: number;
  gpa: number | null;
  intended_degree: string;
  field_of_study: string;
  target_intake_year: number;
  preferred_countries: string[];
  budget_per_year: number;
  funding_plan: string;
  ielts_toefl_status: string;
  gre_gmat_status: string;
  sop_status: string;
  current_stage: Stage;
};

type DashboardSummary = {
  profile: Profile;
  strength: {
    academics: string;
    exams: string;
    sop: string;
  };
  stage: {
    current_stage: Stage;
    label: string;
  };
};

type Todo = {
  id: number;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
};

const STAGES = [
  { key: "building_profile", label: "Building Profile", icon: "📋", step: 1 },
  { key: "discovering_universities", label: "Discovering", icon: "🔍", step: 2 },
  { key: "finalizing_universities", label: "Finalizing", icon: "🎯", step: 3 },
  { key: "preparing_applications", label: "Applications", icon: "📝", step: 4 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login?next=/dashboard");
      return;
    }

    async function load() {
      try {
        const [dashRes, todoRes] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/todos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (dashRes.status === 401 || todoRes.status === 401) {
          window.localStorage.removeItem("token");
          router.replace("/auth/login");
          return;
        }

        if (!dashRes.ok) {
          if (dashRes.status === 400) {
            setNeedsOnboarding(true);
            return;
          }
          const text = await dashRes.text();
          let msg = text;
          try {
            msg = JSON.parse(text).detail;
          } catch { }
          throw new Error(msg || "Failed to load dashboard");
        }
        const dash = (await dashRes.json()) as DashboardSummary;
        setSummary(dash);

        if (todoRes.ok) {
          const tds = (await todoRes.json()) as Todo[];
          setTodos(tds);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function toggleTodo(todo: Todo) {
    const token = window.localStorage.getItem("token");
    if (!token) return;
    const newStatus = todo.status === "completed" ? "pending" : "completed";
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, status: newStatus } : t)),
    );
    await fetch(`${API_BASE_URL}/todos/${todo.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse flex items-center justify-center">
            <span className="text-2xl">🎓</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <section className="mx-auto max-w-lg py-16 text-center animate-fadeIn">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
          <span className="text-4xl">🚀</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Welcome to AI Counsellor!
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          To get your personalized roadmap and university recommendations, let's learn a bit about you first.
        </p>
        <button
          onClick={() => router.push("/onboarding")}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-105"
        >
          <span>✨</span> Start Your Journey
        </button>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="max-w-lg mx-auto py-16 text-center animate-fadeIn">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-rose-600 dark:text-rose-400 mb-4">
          {error ?? "Dashboard could not be loaded."}
        </p>
        <button
          onClick={() => router.push("/onboarding")}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition"
        >
          Go to onboarding
        </button>
      </section>
    );
  }

  const p = summary.profile;
  const currentStageIndex = STAGES.findIndex(s => s.key === summary.stage.current_stage);

  return (
    <section className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Your Journey Dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Track your progress, manage tasks, and stay on top of your study abroad journey
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/onboarding"
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2"
          >
            <span>✏️</span> Edit Profile
          </a>
          <a
            href="/counsellor"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition flex items-center gap-2"
          >
            <span>🤖</span> Ask AI Counsellor
          </a>
        </div>
      </div>

      {/* Progress Stages */}
      <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl hover-lift">
        <h2 className="text-sm font-semibold text-gradient mb-4 uppercase tracking-wide">
          Your Progress
        </h2>
        <div className="flex items-center justify-between">
          {STAGES.map((stage, index) => {
            const isComplete = index < currentStageIndex;
            const isActive = index === currentStageIndex;
            const isPending = index > currentStageIndex;

            return (
              <div key={stage.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${isComplete
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                      : isActive
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 animate-pulse-soft"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                  >
                    {isComplete ? "✓" : stage.icon}
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium text-center ${isComplete
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400"
                      }`}
                  >
                    {stage.label}
                  </p>
                </div>
                {index < STAGES.length - 1 && (
                  <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full transition-all duration-500 ${index < currentStageIndex
                        ? "w-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        : "w-0"
                        }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Summary */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl animate-fadeInUp stagger-1 hover-lift">
          <h2 className="text-sm font-semibold text-gradient mb-4 uppercase tracking-wide flex items-center gap-2">
            <span>👤</span> Profile Summary
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">🎓 Education</p>
              <p className="font-semibold text-slate-900 dark:text-white">{p.current_education_level}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {p.degree_major} • Grad {p.graduation_year}
              </p>
              {p.gpa && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">
                  GPA: {p.gpa.toFixed(1)}
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">🎯 Target</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {p.intended_degree.toUpperCase()} in {p.field_of_study}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Intake: {p.target_intake_year}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">🌍 Countries</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {p.preferred_countries.map((country) => (
                  <span
                    key={country}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs rounded-full"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">💰 Budget</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                ~${p.budget_per_year.toLocaleString()}/year
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 capitalize">
                {p.funding_plan.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Strength */}
        <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl animate-fadeInUp stagger-2 hover-lift">
          <h2 className="text-sm font-semibold text-gradient mb-4 uppercase tracking-wide flex items-center gap-2">
            <span>💪</span> Profile Strength
          </h2>

          <div className="space-y-4">
            <StrengthBar label="Academics" value={summary.strength.academics} icon="📚" />
            <StrengthBar label="Exams" value={summary.strength.exams} icon="✍️" />
            <StrengthBar label="SOP" value={summary.strength.sop} icon="📝" />
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              💡 <strong>Tip:</strong> Complete your standardized tests to boost your profile strength and unlock more university matches!
            </p>
          </div>
        </div>
      </div>

      {/* To-Do Section */}
      <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl animate-fadeInUp stagger-3 hover-lift">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
            <span>✅</span> AI-Generated Tasks
          </h2>
          <a
            href="/applications"
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View Application Guidance <span>→</span>
          </a>
        </div>

        {todos.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              No tasks yet. Your AI counsellor will create personalized to-dos as you progress!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {todos.map((todo, index) => (
              <button
                key={todo.id}
                onClick={() => toggleTodo(todo)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-md group ${todo.status === "completed"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${todo.status === "completed"
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-500"
                      }`}
                  >
                    {todo.status === "completed" && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${todo.status === "completed"
                        ? "text-emerald-700 dark:text-emerald-300 line-through"
                        : "text-slate-900 dark:text-white"
                        }`}
                    >
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {todo.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3 animate-fadeInUp stagger-4">
        <QuickLinkCard
          href="/universities"
          icon="🎓"
          title="Explore Universities"
          description="Discover and shortlist universities that match your profile"
          gradient="from-indigo-500 to-blue-600"
        />
        <QuickLinkCard
          href="/counsellor"
          icon="🤖"
          title="AI Counsellor"
          description="Get personalized advice and answers to your questions"
          gradient="from-purple-500 to-pink-600"
        />
        <QuickLinkCard
          href="/applications"
          icon="📝"
          title="Application Guide"
          description="Step-by-step guidance for your applications"
          gradient="from-emerald-500 to-teal-600"
        />
      </div>
    </section>
  );
}

function StrengthBar({ label, value, icon }: { label: string; value: string; icon: string }) {
  const strengthLevels: Record<string, { percent: number; color: string }> = {
    weak: { percent: 25, color: "from-rose-400 to-rose-500" },
    moderate: { percent: 50, color: "from-amber-400 to-orange-500" },
    strong: { percent: 75, color: "from-emerald-400 to-teal-500" },
    excellent: { percent: 100, color: "from-indigo-400 to-purple-500" },
  };

  const level = strengthLevels[value.toLowerCase()] || strengthLevels.weak;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span>{icon}</span> {label}
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
          {value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${level.color} transition-all duration-1000`}
          style={{ width: `${level.percent}%` }}
        />
      </div>
    </div>
  );
}

function QuickLinkCard({
  href,
  icon,
  title,
  description,
  gradient,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <a
      href={href}
      className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl text-white shadow-lg mb-3 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </a>
  );
}
