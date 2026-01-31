export default function Home() {
  return (
    <section className="relative">
      {/* Hero Section */}
      <div className="grid gap-12 lg:grid-cols-[1.2fr,1fr] lg:items-center py-8 animate-fadeIn">
        {/* Left Content */}
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-indigo-200/50 dark:border-indigo-500/30 animate-fadeInUp stagger-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">AI-Powered Platform</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">• Guided study-abroad planning</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight animate-fadeInUp stagger-2">
            <span className="text-slate-900 dark:text-white">Your journey to</span>
            <br />
            <span className="text-gradient">global education</span>
            <br />
            <span className="text-slate-900 dark:text-white">starts here</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed animate-fadeInUp stagger-3">
            Navigate the complex world of international education with AI-powered guidance.
            From university discovery to application submission—we&apos;re with you every step.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fadeInUp stagger-4">
            <a
              href="/auth/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 animate-gradient"
            >
              Start Your Journey
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-full glass-card px-8 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 transition-all hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover-lift"
            >
              <span>Welcome Back</span>
              <span className="text-slate-400">→</span>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-4 animate-fadeInUp stagger-5">
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient">500+</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Universities</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient">50+</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient">24/7</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI Support</p>
            </div>
          </div>
        </div>

        {/* Right Side - Journey Card */}
        <div className="relative animate-fadeInUp stagger-3">
          {/* Glow behind card */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl scale-110"></div>

          <div className="relative rounded-3xl glass-card border border-slate-200/50 dark:border-slate-700/50 p-6 hover-lift">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Your Journey
              </h2>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
                6 Steps
              </span>
            </div>

            {/* Journey Steps */}
            <div className="space-y-3">
              {[
                { step: 1, title: "Sign Up & Onboarding", icon: "✨", color: "from-indigo-500 to-blue-500" },
                { step: 2, title: "Profile & Goal Setting", icon: "🎯", color: "from-blue-500 to-cyan-500" },
                { step: 3, title: "AI-Powered Assessment", icon: "🤖", color: "from-cyan-500 to-teal-500" },
                { step: 4, title: "University Discovery", icon: "🏛️", color: "from-teal-500 to-emerald-500" },
                { step: 5, title: "Shortlist & Lock", icon: "🔒", color: "from-emerald-500 to-green-500" },
                { step: 6, title: "Apply & Track", icon: "📝", color: "from-green-500 to-lime-500" },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="group flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all hover-lift border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-white text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">Step {item.step}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20 pt-12 border-t border-slate-200/50 dark:border-slate-800/50">
        <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white mb-2 animate-fadeIn">
          Why Choose <span className="text-gradient">AI Counsellor</span>?
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-12 animate-fadeIn">
          Smart features designed for your success
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🧠",
              title: "AI-Powered Insights",
              description: "Get personalized recommendations based on your profile, goals, and budget.",
              gradient: "from-indigo-500 to-purple-500",
            },
            {
              icon: "🎯",
              title: "Smart Matching",
              description: "Find universities that match your academic background and career aspirations.",
              gradient: "from-purple-500 to-pink-500",
            },
            {
              icon: "📊",
              title: "Progress Tracking",
              description: "Monitor your application status and stay on top of deadlines.",
              gradient: "from-pink-500 to-rose-500",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl glass-card border border-slate-200/50 dark:border-slate-700/50 hover-lift animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl text-white shadow-lg shadow-indigo-500/20 mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 animate-fadeIn">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to start your global education journey?
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Join thousands of students who have found their dream universities with AI Counsellor.
          </p>
          <a
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-indigo-600 font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            Get Started Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
