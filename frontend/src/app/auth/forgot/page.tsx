"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          For this prototype, we simply confirm that a reset link would be sent.
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
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          Send reset link
        </button>
      </form>
      {submitted && (
        <p className="text-sm text-emerald-300">
          If this were a production app, a reset link would now be sent to{" "}
          <span className="font-semibold">{email}</span>.
        </p>
      )}
    </section>
  );
}

