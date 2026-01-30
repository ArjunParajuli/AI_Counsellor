"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Login failed");
      }
      const data = (await res.json()) as { access_token: string };
      window.localStorage.setItem("token", data.access_token);
      router.push(nextPath);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Log in to continue your guided journey.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-indigo-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            type="password"
            className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-indigo-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 whitespace-pre-wrap break-words">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="flex items-center justify-between text-sm text-slate-300">
        <p>
          New here?{" "}
          <a
            href="/auth/signup"
            className="font-semibold text-indigo-300 hover:text-indigo-200"
          >
            Create an account
          </a>
        </p>
        <a
          href="/auth/forgot"
          className="text-xs font-medium text-slate-300 underline underline-offset-4 hover:text-slate-100"
        >
          Forgot password?
        </a>
      </div>
    </section>
  );
}

