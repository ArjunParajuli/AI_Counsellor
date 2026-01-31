"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

type LockedUniversity = {
  id: number;
  university_id: number;
  name: string;
  country: string;
  city?: string;
  program?: string;
  tuition?: number;
};

type Guidance = {
  locked_university: LockedUniversity | null;
  locked_universities: LockedUniversity[];
  required_documents: string[];
  timeline: string[];
};

type Todo = {
  id: number;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  due_date?: string;
  created_by_ai: boolean;
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState<LockedUniversity | null>(null);

  // Load guidance on mount
  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login?next=/applications");
      return;
    }

    async function loadGuidance() {
      try {
        const guidanceRes = await fetch(`${API_BASE_URL}/application-guidance`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (guidanceRes.ok) {
          const data = (await guidanceRes.json()) as Guidance;
          setGuidance(data);
          // Default to first locked university
          if (data.locked_universities?.length > 0) {
            setSelectedUni(data.locked_universities[0]);
          }
        } else if (guidanceRes.status !== 404 && guidanceRes.status !== 400) {
          const text = await guidanceRes.text();
          throw new Error(text || "Failed to load guidance");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadGuidance();
  }, [router]);

  // Load todos when selectedUni changes
  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token || !selectedUni) return;

    const universityId = selectedUni.university_id;

    async function loadTodos() {
      try {
        // Filter by university_id for university-specific tasks
        const todosRes = await fetch(
          `${API_BASE_URL}/todos?university_id=${universityId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (todosRes.ok) {
          const todoData = (await todosRes.json()) as Todo[];
          setTodos(todoData);
        }
      } catch (err) {
        console.error("Failed to load todos:", err);
      }
    }

    loadTodos();
  }, [selectedUni]);

  async function toggleTodo(todo: Todo) {
    const token = window.localStorage.getItem("token");
    if (!token) return;

    const newStatus = todo.status === "completed" ? "pending" : "completed";
    const res = await fetch(`${API_BASE_URL}/todos/${todo.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Todo;
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (newStatus === "completed") {
        showToast(`✨ Task completed: ${todo.title}`, "success");
      } else {
        showToast(`📋 Task reopened: ${todo.title}`, "info");
      }
    } else {
      showToast("Failed to update task", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading Guidance...</p>
        </div>
      </div>
    );
  }

  if (!guidance || !guidance.locked_universities?.length) {
    return (
      <section className="max-w-xl mx-auto py-16 text-center animate-fadeIn">
        <div className="w-24 h-24 mx-auto mb-8 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-5xl shadow-xl">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">No Locked Universities</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          {error ?? "You need to lock at least one university before you can see application guidance. This will unlock tailored document lists and timelines."}
        </p>
        <button
          onClick={() => router.push("/universities")}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition active:scale-95"
        >
          Discover Universities
        </button>
      </section>
    );
  }

  const lockedUnis = guidance.locked_universities;
  const pendingTodos = todos.filter((t) => t.status !== "completed");
  const completedTodos = todos.filter((t) => t.status === "completed");

  return (
    <section className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Application Guidance
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Managing applications for {lockedUnis.length} locked {lockedUnis.length === 1 ? "university" : "universities"}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/counsellor"
            className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition text-center"
          >
            Ask AI Help
          </a>
          <a
            href="/universities"
            className="flex-1 md:flex-none px-6 py-2.5 glass-card border border-slate-200 dark:border-slate-700 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-center"
          >
            Manage Unis
          </a>
        </div>
      </div>

      {/* Locked Universities Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lockedUnis.map((uni) => (
          <button
            key={uni.id}
            onClick={() => setSelectedUni(uni)}
            className={`text-left p-5 rounded-2xl border transition-all hover-lift ${selectedUni?.id === uni.id
              ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/50 shadow-lg"
              : "glass-card border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-400/50"
              }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">🏛️</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                🔒 LOCKED
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
              {uni.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>📍</span> {uni.city || uni.country}
            </p>
            {uni.program && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                {uni.program}
              </p>
            )}
          </button>
        ))}
      </div>

      {selectedUni && (
        <>
          {/* Selected Uni Highlight */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 dark:border-emerald-500/30 p-8 shadow-xl hover-lift">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl pointer-events-none">🎓</div>
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Currently Viewing</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {selectedUni.name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span>📍</span> {selectedUni.city}, {selectedUni.country}
                {selectedUni.tuition && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">${selectedUni.tuition.toLocaleString()}/yr</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Documents */}
            <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl hover-lift animate-fadeInUp stagger-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                <span>📎</span> Required Docs
              </h2>
              <ul className="space-y-3">
                {guidance.required_documents.map((doc) => (
                  <li key={doc} className="flex items-start gap-3 group">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Timeline */}
            <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl hover-lift animate-fadeInUp stagger-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2">
                <span>📅</span> Timeline
              </h2>
              <ol className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {guidance.timeline.map((step, idx) => (
                  <li key={step} className="flex items-start gap-4 relative z-10 group">
                    <span className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold shadow-lg group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-tight pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Todos */}
            <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl hover-lift animate-fadeInUp stagger-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                <span>✅</span> Journey Tasks
              </h2>
              <ul className="space-y-4">
                {pendingTodos.length === 0 && (
                  <li className="text-sm text-slate-500 dark:text-slate-400 italic">No pending tasks. Ask the counsellor for next steps!</li>
                )}
                {pendingTodos.slice(0, 6).map((todo) => (
                  <li key={todo.id} className="flex items-start gap-3 group">
                    <button
                      onClick={() => toggleTodo(todo)}
                      className="mt-0.5 h-5 w-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all flex items-center justify-center group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-emerald-500">✓</span>
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{todo.title}</p>
                      {todo.created_by_ai && (
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter mt-1 inline-block">AI Assistant</span>
                      )}
                    </div>
                  </li>
                ))}
                {completedTodos.length > 0 && (
                  <li className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-2">
                      <span>✨</span> {completedTodos.length} Tasks Successfully Completed
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="p-6 rounded-2xl border border-indigo-200/50 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 animate-fadeInUp stagger-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center italic">
          &quot;This roadmap is dynamically generated based on your locked university selections and current journey stage.
          Use the AI Counsellor to refine your strategy or get help with specific documents.&quot;
        </p>
      </div>
    </section>
  );
}
