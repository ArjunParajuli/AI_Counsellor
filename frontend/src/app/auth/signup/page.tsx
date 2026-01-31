"use client";

import { FormEvent, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import Script from "next/script";

// Declare Google global
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      setGoogleLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Google sign-in failed");
        }

        const data = (await res.json()) as { access_token: string };
        window.localStorage.setItem("token", data.access_token);
        router.push("/onboarding");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setGoogleLoading(false);
      }
    },
    [router]
  );

  const initializeGoogleSignIn = useCallback(() => {
    if (window.google && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      });

      const buttonDiv = document.getElementById("google-signup-button");
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "pill",
          width: 300,
        });
      }
    }
  }, [googleClientId, handleGoogleCallback]);

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
      router.push("/auth/login?next=/onboarding");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={initializeGoogleSignIn}
          strategy="afterInteractive"
        />
      )}

      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-md relative animate-fadeIn">
          {/* Glow effect behind card */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 rounded-3xl blur-2xl scale-105"></div>

          <div className="relative glass-card rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center text-2xl text-white shadow-lg shadow-purple-500/30 animate-pulse-glow">
                🚀
              </div>
              <h1 className="text-2xl font-bold text-gradient mb-2">Create Account</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Start your global education journey
              </p>
            </div>

            {/* Google Sign-Up */}
            {googleClientId && (
              <div className="space-y-4 mb-6">
                <div id="google-signup-button" className="flex justify-center"></div>

                {googleLoading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    Creating account with Google...
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="glass-card px-4 py-1 rounded-full text-slate-500 dark:text-slate-400">
                      or sign up with email
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
              Already have an account?{" "}
              <a href="/auth/login" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
