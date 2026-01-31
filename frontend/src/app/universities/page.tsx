"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import StudentLifeInsights from "@/components/student-life-insights";
import InterviewSimulator from "@/components/interview-simulator";
import { useToast } from "@/components/toast-provider";

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

const COUNTRIES = ["USA", "UK", "Canada", "Germany", "Australia", "Netherlands", "Singapore", "Ireland", "France"];

const categoryConfig = {
  dream: { label: "DREAM", emoji: "⭐", color: "from-purple-500 to-pink-500", bg: "bg-purple-500/10 dark:bg-purple-500/20", border: "border-purple-200 dark:border-purple-400/50", text: "text-purple-600 dark:text-purple-300" },
  target: { label: "TARGET", emoji: "🎯", color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 dark:bg-blue-500/20", border: "border-blue-200 dark:border-blue-400/50", text: "text-blue-600 dark:text-blue-300" },
  safe: { label: "SAFE", emoji: "✅", color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/20", border: "border-emerald-200 dark:border-emerald-400/50", text: "text-emerald-600 dark:text-emerald-300" },
};

export default function UniversitiesPage() {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [mine, setMine] = useState<UserUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "shortlist">("browse");

  // Filters
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [maxBudget, setMaxBudget] = useState<number>(100000);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login?next=/universities");
      return;
    }

    async function load() {
      try {
        const [uniRes, mineRes] = await Promise.all([
          fetch(`${API_BASE_URL}/universities`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/my-universities`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!uniRes.ok) throw new Error("Failed to load universities");
        const unis = (await uniRes.json()) as University[];
        setUniversities(unis);
        if (mineRes.ok) {
          const m = (await mineRes.json()) as UserUniversity[];
          setMine(m);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const { showToast } = useToast();

  async function handleShortlist(uni: University, category: "dream" | "target" | "safe") {
    const token = window.localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/universities/${uni.id}/shortlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) {
      showToast("Failed to shortlist university", "error");
      return;
    }
    const link = (await res.json()) as UserUniversity;
    setMine((prev) => [...prev.filter((m) => m.university.id !== uni.id), link]);
    showToast(`${uni.name} added to ${category.toUpperCase()} list`, "success");
  }

  async function handleLock(link: UserUniversity) {
    const token = window.localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/universities/${link.id}/lock`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      showToast("Failed to lock university", "error");
      return;
    }
    const updated = (await res.json()) as UserUniversity;
    setMine((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    showToast(`🔒 ${link.university.name} locked!`, "success");
  }

  async function handleUnlock(link: UserUniversity) {
    const token = window.localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/universities/${link.id}/unlock`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      showToast("Failed to unlock university", "error");
      return;
    }
    const updated = (await res.json()) as UserUniversity;
    setMine((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    showToast(`🔓 ${link.university.name} unlocked`, "info");
  }

  async function handleRemove(link: UserUniversity) {
    const token = window.localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/my-universities/${link.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMine((prev) => prev.filter((m) => m.id !== link.id));
      showToast(`${link.university.name} removed from shortlist`, "warning");
    } else {
      showToast("Failed to remove university", "error");
    }
  }

  const filteredUniversities = universities.filter((u) => {
    if (countryFilter !== "all" && u.country !== countryFilter) return false;
    if (u.tuition_per_year > maxBudget) return false;
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const shortlistedIds = new Set(mine.map((m) => m.university.id));
  const shortlisted = mine.filter((m) => m.status === "shortlisted");
  const locked = mine.filter((m) => m.status === "locked");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 animate-pulse">Scanning Universities...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            University Discovery
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {universities.length} universities available • {mine.length} in your workspace
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-full glass-card p-1 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab("browse")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === "browse"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white"
              }`}
          >
            Browse All
          </button>
          <button
            onClick={() => setActiveTab("shortlist")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === "shortlist"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white"
              }`}
          >
            My Shortlist ({mine.length})
          </button>
        </div>
      </div>

      {activeTab === "browse" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center p-6 rounded-2xl glass-card border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover-lift">
            <div className="flex-1 min-w-[280px]">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, program or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="relative min-w-[180px]">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full appearance-none px-4 py-3 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="all">All Regions</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</span>
            </div>

            <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget</span>
              <input
                type="range"
                min="5000"
                max="100000"
                step="5000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-32 accent-indigo-500"
              />
              <span className="text-sm text-gradient font-bold w-20">
                ${maxBudget.toLocaleString()}
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Found {filteredUniversities.length} matches
            </div>
          </div>

          {/* University Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUniversities.map((uni, idx) => {
              const isShortlisted = shortlistedIds.has(uni.id);
              const myEntry = mine.find((m) => m.university.id === uni.id);

              return (
                <div
                  key={uni.id}
                  className={`group rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-xl animate-fadeInUp stagger-${(idx % 5) + 1} ${isShortlisted
                    ? `${categoryConfig[myEntry?.category || "target"].bg} ${categoryConfig[myEntry?.category || "target"].border}`
                    : "glass-card border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-400/50"
                    }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <a
                        href={`/universities/${uni.id}`}
                        className="font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors hover:underline"
                      >
                        {uni.name}
                      </a>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <span>📍</span> {uni.city}, {uni.country}
                      </p>
                    </div>
                    {myEntry && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${categoryConfig[myEntry.category].bg} ${categoryConfig[myEntry.category].text} ${categoryConfig[myEntry.category].border} border`}>
                        {categoryConfig[myEntry.category].emoji} {categoryConfig[myEntry.category].label}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-5">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                      <span className="text-base">📚</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{uni.field_of_study}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                      <span className="text-base">🎓</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium capitalize">{uni.degree_level}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                      <span className="text-base">💰</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">${uni.tuition_per_year.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                      <span className="text-base">📊</span>
                      <span className={`capitalize font-bold ${uni.competition_level === "high" ? "text-rose-500 dark:text-rose-400" :
                        uni.competition_level === "medium" ? "text-amber-500 dark:text-amber-400" : "text-emerald-500 dark:text-emerald-400"
                        }`}>
                        {uni.competition_level}
                      </span>
                    </div>
                  </div>

                  {uni.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed italic">
                      &quot;{uni.description}&quot;
                    </p>
                  )}

                  {/* Actions */}
                  {!isShortlisted ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShortlist(uni, "dream")}
                        className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 hover:bg-purple-500 hover:text-white transition-all duration-300"
                      >
                        ⭐ DREAM
                      </button>
                      <button
                        onClick={() => handleShortlist(uni, "target")}
                        className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all duration-300"
                      >
                        🎯 TARGET
                      </button>
                      <button
                        onClick={() => handleShortlist(uni, "safe")}
                        className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all duration-300"
                      >
                        ✅ SAFE
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-tight">Already in Shortlist</span>
                      <button
                        onClick={() => setActiveTab("shortlist")}
                        className="p-1 px-3 rounded-lg text-[10px] font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition"
                      >
                        View &rarr;
                      </button>
                    </div>
                  )}

                  {/* View Details Link */}
                  <a
                    href={`/universities/${uni.id}`}
                    className="mt-3 block w-full text-center py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                  >
                    View Details →
                  </a>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "shortlist" && (
        <div className="grid gap-10 lg:grid-cols-[1fr,320px] animate-fadeIn">
          {/* Main Shortlist Content */}
          <div className="space-y-8">
            {/* Shortlisted */}
            {shortlisted.length === 0 && locked.length === 0 ? (
              <div className="p-12 text-center glass-card rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl">
                  🏛️
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your list is empty</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                  Start discovery for your dream universities and shortlist them to see them here.
                </p>
                <button
                  onClick={() => setActiveTab("browse")}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold shadow-lg shadow-indigo-500/25 hover:scale-105 transition"
                >
                  Start Discovery
                </button>
              </div>
            ) : (
              shortlisted.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>✨</span> Current Shortlist ({shortlisted.length})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {shortlisted.map((link) => {
                      const cfg = categoryConfig[link.category];
                      return (
                        <div
                          key={link.id}
                          className="group p-5 rounded-2xl glass-card border border-slate-200/50 dark:border-slate-700/50 shadow hover:shadow-xl transition-all hover-lift"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {link.university.name}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                              {cfg.emoji} {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
                            <span>📍</span> {link.university.city}, {link.university.country}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLock(link)}
                              className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                            >
                              🔒 Lock This
                            </button>
                            <button
                              onClick={() => handleRemove(link)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-500 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🔒</span> Locked & Ready ({locked.length})
                  </h3>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-bold animate-pulse">
                    Active Journey
                  </span>
                </div>
                <div className="space-y-6">
                  {locked.map((link) => (
                    <LockedUniversityCard
                      key={link.id}
                      link={link}
                      onUnlock={() => handleUnlock(link)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Tips/Status */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">Quick Navigation</h4>
              <nav className="space-y-2">
                <a href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm text-slate-600 dark:text-slate-300">
                  <span>📊</span> Dashboard
                </a>
                <a href="/applications" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm text-slate-600 dark:text-slate-300">
                  <span>📝</span> Applications
                </a>
                <a href="/counsellor" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm text-slate-600 dark:text-slate-300">
                  <span>🤖</span> AI Counsellor
                </a>
              </nav>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
              <h4 className="font-bold mb-2">Need Help Deciding?</h4>
              <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                Not sure which university is best for you? Ask our AI counsellor to compare them based on your career goals!
              </p>
              <button
                onClick={() => router.push("/counsellor")}
                className="w-full py-2.5 rounded-xl bg-white text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition"
              >
                Chat with AI
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-4 glass-card border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-2xl animate-fadeInUp">
          <p className="text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <span>⚠️</span> {error}
          </p>
        </div>
      )}
    </section>
  );
}

// Expandable card for locked universities with Student Life Insights and Interview Simulator
function LockedUniversityCard({ link, onUnlock }: { link: UserUniversity; onUnlock: () => void }) {
  const [expandedSection, setExpandedSection] = useState<"none" | "studentLife" | "interview">("none");

  const toggleSection = (section: "studentLife" | "interview") => {
    setExpandedSection(expandedSection === section ? "none" : section);
  };

  return (
    <div className="rounded-3xl border border-emerald-200/50 dark:border-emerald-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl animate-fadeIn">
      {/* Header Card */}
      <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl text-white shadow-lg shadow-emerald-500/30 flex-shrink-0 animate-float">
              🏛️
            </div>
            <div>
              <h4 className="font-bold text-xl text-slate-900 dark:text-white leading-tight">{link.university.name}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                <span>📍</span> {link.university.city}, {link.university.country}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/30 border border-emerald-400">
              <span>🔒</span> LOCKED
            </span>
            <button
              onClick={onUnlock}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-500 transition-all"
            >
              🔓 Unlock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-card dark:bg-slate-800/40 rounded-2xl p-3 border border-emerald-100/50 dark:border-emerald-900/20">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Tuition</p>
            <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              ${link.university.tuition_per_year.toLocaleString()}/yr
            </p>
          </div>
          <div className="glass-card dark:bg-slate-800/40 rounded-2xl p-3 border border-emerald-100/50 dark:border-emerald-900/20">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Field of Study</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{link.university.field_of_study}</p>
          </div>
          <div className="glass-card dark:bg-slate-800/40 rounded-2xl p-3 border border-emerald-100/50 dark:border-emerald-900/20">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Degree Level</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 capitalize">{link.university.degree_level}</p>
          </div>
          <div className="glass-card dark:bg-slate-800/40 rounded-2xl p-3 border border-emerald-100/50 dark:border-emerald-900/20">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Selectivity</p>
            <p className={`font-bold capitalize ${link.university.competition_level === "high"
              ? "text-rose-500"
              : link.university.competition_level === "medium"
                ? "text-amber-500"
                : "text-emerald-500"
              }`}>
              {link.university.competition_level}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => toggleSection("studentLife")}
            className={`py-3 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${expandedSection === "studentLife"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
              : "glass-card text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
              }`}
          >
            <span>🏙️</span>
            <span className="hidden sm:inline">Student Life</span>
            <span className="sm:hidden">Life</span>
          </button>
          <button
            onClick={() => toggleSection("interview")}
            className={`py-3 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${expandedSection === "interview"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 scale-[1.02]"
              : "glass-card text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/40"
              }`}
          >
            <span>🎤</span>
            <span className="hidden sm:inline">Interview Prep</span>
            <span className="sm:hidden">Interview</span>
          </button>
          <a
            href="/applications"
            className="py-3 px-4 rounded-2xl text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
          >
            <span>📝</span>
            <span className="hidden sm:inline">Start Application</span>
            <span className="sm:hidden">Apply</span>
          </a>
        </div>
      </div>

      {/* Expandable Student Life Insights */}
      {expandedSection === "studentLife" && (
        <div className="border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
          <StudentLifeInsights
            universityId={link.university.id}
            universityName={link.university.name}
            city={link.university.city || ""}
            country={link.university.country}
          />
        </div>
      )}

      {/* Expandable Interview Simulator */}
      {expandedSection === "interview" && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-6 animate-fadeIn">
          <InterviewSimulator
            universityId={link.university.id}
            universityName={link.university.name}
            country={link.university.country}
            program={link.university.field_of_study}
            onClose={() => setExpandedSection("none")}
          />
        </div>
      )}
    </div>
  );
}
