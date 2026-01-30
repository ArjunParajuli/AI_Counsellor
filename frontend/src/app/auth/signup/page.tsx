"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Signup failed");
      }
      // After signup, immediately go to onboarding
      router.push("/auth/login?next=/onboarding");
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
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Start your guided study-abroad journey in a few steps.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-200">
            Full name
          </label>
          <input
            className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-indigo-400"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
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
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-slate-300">
        Already have an account?{" "}
        <a
          href="/auth/login"
          className="font-semibold text-indigo-300 hover:text-indigo-200"
        >
          Log in
        </a>
      </p>
    </section>
  );
}

