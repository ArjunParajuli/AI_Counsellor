import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Counsellor - Your Study Abroad Guide",
  description: "Plan your study-abroad journey with AI-powered personalized guidance, university recommendations, and application tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ToastProvider>
            <div className="min-h-screen relative overflow-hidden">
              {/* Futuristic Background */}
              <div className="fixed inset-0 pointer-events-none z-0">
                {/* Cyber Grid */}
                <div className="absolute inset-0 cyber-grid" />

                {/* Gradient Orbs */}
                <div className="orb orb-indigo w-[600px] h-[600px] -top-40 -right-40 animate-float" />
                <div className="orb orb-purple w-[500px] h-[500px] top-1/2 -left-60 animate-float" style={{ animationDelay: '2s' }} />
                <div className="orb orb-cyan w-[400px] h-[400px] -bottom-20 right-1/4 animate-float" style={{ animationDelay: '4s' }} />

                {/* Rotating accent ring */}
                <div className="absolute top-20 left-20 w-32 h-32 border border-indigo-500/10 rounded-full animate-rotate-slow hidden lg:block" />
                <div className="absolute bottom-40 right-20 w-48 h-48 border border-purple-500/10 rounded-full animate-rotate-slow hidden lg:block" style={{ animationDirection: 'reverse' }} />
              </div>

              {/* Header */}
              <header className="relative border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                  <a href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105 animate-pulse-glow">
                        AI
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gradient">
                        AI Counsellor
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                        Your study-abroad journey
                      </p>
                    </div>
                  </a>
                  <NavBar />
                </div>
              </header>

              {/* Main content */}
              <main className="relative mx-auto max-w-6xl px-4 py-8 z-10">
                {children}
              </main>

              {/* Footer */}
              <footer className="relative border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl py-8 mt-16">
                <div className="mx-auto max-w-6xl px-4">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-lg">
                        AI
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        © 2026 AI Counsellor. All rights reserved.
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <a href="#" className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition hover-lift">Privacy</a>
                      <a href="#" className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition hover-lift">Terms</a>
                      <a href="#" className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition hover-lift">Support</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
