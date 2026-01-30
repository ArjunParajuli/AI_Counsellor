"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type Guidance = {
  locked_university: {
    id: number;
    name: string;
    country: string;
  };
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
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login?next=/applications");
      return;
    }

    async function load() {
      try {
        const [guidanceRes, todosRes] = await Promise.all([
          fetch(`${API_BASE_URL}/application-guidance`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/todos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (guidanceRes.ok) {
          const data = (await guidanceRes.json()) as Guidance;
          setGuidance(data);
        } else if (guidanceRes.status !== 404) {
          const text = await guidanceRes.text();
          throw new Error(text || "Failed to load guidance");
        }

        if (todosRes.ok) {
          const todoData = (await todosRes.json()) as Todo[];
          setTodos(todoData);
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
    }
  }

  if (loading) {
    return <p>Loading application guidance...</p>;
  }

  if (!guidance) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-400 whitespace-pre-wrap break-words">
          {error ??
            "You need to lock at least one university before you can see application guidance."}
        </p>
        <button
          onClick={() => router.push("/universities")}
          className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Go to university locking
        </button>
      </section>
    );
  }

  const pendingTodos = todos.filter((t) => t.status !== "completed");
  const completedTodos = todos.filter((t) => t.status === "completed");

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Application guidance
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Focused guidance for your locked university. Complete tasks to stay on track.
        </p>
      </div>

      <div className="rounded-xl border border-emerald-400/60 bg-emerald-950/30 p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
          Locked university
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-50">
          {guidance.locked_university.name}
        </p>
        <p className="text-xs text-slate-200">
          {guidance.locked_university.country}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Documents */}
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Required documents
          </h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-200">
            {guidance.required_documents.map((doc) => (
              <li key={doc} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-300" />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Timeline
          </h2>
          <ol className="mt-2 space-y-1 text-xs text-slate-200">
            {guidance.timeline.map((step, idx) => (
              <li key={step} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Todos */}
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Your tasks ({pendingTodos.length} pending)
          </h2>
          <ul className="mt-2 space-y-2 text-xs text-slate-200">
            {pendingTodos.length === 0 && (
              <li className="text-slate-400">No pending tasks. Talk to the AI counsellor to get recommendations!</li>
            )}
            {pendingTodos.slice(0, 5).map((todo) => (
              <li key={todo.id} className="flex items-start gap-2">
                <button
                  onClick={() => toggleTodo(todo)}
                  className="mt-0.5 h-4 w-4 rounded border border-white/30 hover:border-emerald-400 flex-shrink-0"
                />
                <div>
                  <span className="font-medium">{todo.title}</span>
                  {todo.created_by_ai && (
                    <span className="ml-1 text-[10px] text-indigo-300">(AI)</span>
                  )}
                </div>
              </li>
            ))}
            {completedTodos.length > 0 && (
              <li className="text-emerald-400 text-[10px] pt-1">
                ✓ {completedTodos.length} completed
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <a
          href="/counsellor"
          className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Ask AI for help
        </a>
        <a
          href="/universities"
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:border-indigo-400"
        >
          Manage universities
        </a>
      </div>

      <p className="text-xs text-slate-400">
        Tasks are created by the AI counsellor based on your journey stage. Complete them to strengthen your application.
      </p>
    </section>
  );
}
