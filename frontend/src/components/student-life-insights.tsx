"use client";

import { useState } from "react";

type Review = {
    id: string;
    author: string;
    avatar?: string;
    country: string;
    program: string;
    year: number;
    rating: number;
    title: string;
    content: string;
    pros: string[];
    cons: string[];
    helpful: number;
    verified: boolean;
};

type LivingInfo = {
    costOfLiving: {
        rent: { min: number; max: number; currency: string };
        food: number;
        transport: number;
        total: number;
    };
    safety: { score: number; description: string };
    weather: { description: string; avgTemp: { summer: number; winter: number } };
    foreignerFriendly: { score: number; description: string };
    publicTransport: { score: number; description: string };
    healthcare: { score: number; description: string };
};

type AlumniProfile = {
    id: string;
    name: string;
    avatar?: string;
    country: string;
    program: string;
    graduationYear: number;
    currentRole: string;
    company: string;
    linkedIn?: string;
    openToConnect: boolean;
    topics: string[];
};

type StudentLifeProps = {
    universityId: number;
    universityName: string;
    city: string;
    country: string;
};

// Mock data - in real implementation, this would come from API
const mockReviews: Review[] = [
    {
        id: "1",
        author: "Priya Sharma",
        country: "India",
        program: "MS Computer Science",
        year: 2024,
        rating: 4.5,
        title: "Great experience with supportive community",
        content: "The university has excellent research facilities and the professors are very approachable. The international student office helped me settle in quickly.",
        pros: ["Strong research programs", "Diverse community", "Career services"],
        cons: ["High cost of living", "Cold winters"],
        helpful: 24,
        verified: true,
    },
    {
        id: "2",
        author: "Ahmed Hassan",
        country: "Egypt",
        program: "MBA",
        year: 2023,
        rating: 4.0,
        title: "Excellent networking opportunities",
        content: "The business school has strong industry connections. I landed my dream job through campus recruitment.",
        pros: ["Industry connections", "Alumni network", "Modern facilities"],
        cons: ["Competitive environment", "Heavy workload"],
        helpful: 18,
        verified: true,
    },
];

const mockLivingInfo: LivingInfo = {
    costOfLiving: {
        rent: { min: 800, max: 1500, currency: "USD" },
        food: 400,
        transport: 100,
        total: 1500,
    },
    safety: { score: 4.2, description: "Generally safe with low crime rates" },
    weather: { description: "Four distinct seasons", avgTemp: { summer: 25, winter: -5 } },
    foreignerFriendly: { score: 4.5, description: "Very welcoming to international students" },
    publicTransport: { score: 4.0, description: "Good bus and metro connectivity" },
    healthcare: { score: 4.3, description: "Quality healthcare with student insurance" },
};

const mockAlumni: AlumniProfile[] = [
    {
        id: "1",
        name: "Raj Patel",
        country: "India",
        program: "MS Data Science",
        graduationYear: 2022,
        currentRole: "Senior Data Scientist",
        company: "Google",
        openToConnect: true,
        topics: ["Career advice", "Visa process", "Housing tips"],
    },
    {
        id: "2",
        name: "Sarah Chen",
        country: "China",
        program: "MS Computer Science",
        graduationYear: 2021,
        currentRole: "Software Engineer",
        company: "Microsoft",
        openToConnect: true,
        topics: ["Interview prep", "Campus life", "Internships"],
    },
];

export default function StudentLifeInsights({ universityName, city, country }: StudentLifeProps) {
    const [activeTab, setActiveTab] = useState<"reviews" | "living" | "alumni">("reviews");
    const [showReviewForm, setShowReviewForm] = useState(false);

    const tabs = [
        { id: "reviews", label: "Student Reviews", icon: "⭐", count: mockReviews.length },
        { id: "living", label: "Living & Costs", icon: "🏠" },
        { id: "alumni", label: "Connect with Alumni", icon: "🤝", count: mockAlumni.length },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🎓</span>
                    <div>
                        <h2 className="text-xl font-bold">Student Life Insights</h2>
                        <p className="text-indigo-100 text-sm">
                            {universityName} • {city}, {country}
                        </p>
                    </div>
                </div>
                <p className="text-sm text-indigo-100 mt-2">
                    Real experiences from students and alumni to help you make an informed decision
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id
                                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-white dark:bg-slate-900"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count && (
                            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Overall Rating */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-bold text-slate-900 dark:text-white">4.3</div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={star <= 4 ? "text-yellow-400" : "text-slate-300"}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-500">Based on {mockReviews.length} reviews</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                <span>✍️</span> Write a Review
                            </button>
                        </div>

                        {/* Review Form */}
                        {showReviewForm && (
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 animate-fadeInUp">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Share Your Experience</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Review title..."
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                    <textarea
                                        placeholder="Tell us about your experience..."
                                        rows={4}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                                            Submit Review
                                        </button>
                                        <button
                                            onClick={() => setShowReviewForm(false)}
                                            className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviews List */}
                        <div className="space-y-4">
                            {mockReviews.map((review, index) => (
                                <div
                                    key={review.id}
                                    className={`bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 animate-fadeInUp stagger-${index + 1}`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {review.author.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-slate-900 dark:text-white">{review.author}</p>
                                                    {review.verified && (
                                                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                            ✓ Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {review.program} • Class of {review.year} • From {review.country}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    className={`text-sm ${star <= review.rating ? "text-yellow-400" : "text-slate-300"}`}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{review.title}</h4>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{review.content}</p>

                                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">👍 Pros</p>
                                            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                                                {review.pros.map((pro, i) => (
                                                    <li key={i}>• {pro}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3">
                                            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">👎 Cons</p>
                                            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                                                {review.cons.map((con, i) => (
                                                    <li key={i}>• {con}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <button className="flex items-center gap-1 hover:text-indigo-600 transition">
                                            <span>👍</span> Helpful ({review.helpful})
                                        </button>
                                        <button className="hover:text-indigo-600 transition">Reply</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Living Info Tab */}
                {activeTab === "living" && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Cost of Living */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="text-xl">💰</span> Monthly Cost of Living
                            </h3>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                        ${mockLivingInfo.costOfLiving.rent.min}-{mockLivingInfo.costOfLiving.rent.max}
                                    </p>
                                    <p className="text-sm text-slate-500">Rent</p>
                                </div>
                                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        ${mockLivingInfo.costOfLiving.food}
                                    </p>
                                    <p className="text-sm text-slate-500">Food</p>
                                </div>
                                <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        ${mockLivingInfo.costOfLiving.transport}
                                    </p>
                                    <p className="text-sm text-slate-500">Transport</p>
                                </div>
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-center text-white">
                                    <p className="text-2xl font-bold">~${mockLivingInfo.costOfLiving.total}</p>
                                    <p className="text-sm opacity-80">Total/Month</p>
                                </div>
                            </div>
                        </div>

                        {/* Quality of Life Scores */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { label: "Safety", score: mockLivingInfo.safety.score, desc: mockLivingInfo.safety.description, icon: "🛡️", color: "emerald" },
                                { label: "Foreigner Friendly", score: mockLivingInfo.foreignerFriendly.score, desc: mockLivingInfo.foreignerFriendly.description, icon: "🌍", color: "blue" },
                                { label: "Public Transport", score: mockLivingInfo.publicTransport.score, desc: mockLivingInfo.publicTransport.description, icon: "🚇", color: "purple" },
                                { label: "Healthcare", score: mockLivingInfo.healthcare.score, desc: mockLivingInfo.healthcare.description, icon: "🏥", color: "rose" },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="font-medium text-slate-900 dark:text-white">{item.label}</span>
                                        </div>
                                        <span className={`text-lg font-bold ${item.score >= 4 ? "text-emerald-500" : item.score >= 3 ? "text-yellow-500" : "text-rose-500"
                                            }`}>
                                            {item.score}/5
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r from-${item.color}-400 to-${item.color}-600 transition-all duration-500`}
                                            style={{ width: `${(item.score / 5) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Weather */}
                        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl p-5 text-white">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <span className="text-xl">🌤️</span> Weather & Climate
                            </h3>
                            <p className="mb-4">{mockLivingInfo.weather.description}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/20 rounded-lg p-3 text-center">
                                    <p className="text-3xl font-bold">{mockLivingInfo.weather.avgTemp.summer}°C</p>
                                    <p className="text-sm opacity-80">Summer Avg</p>
                                </div>
                                <div className="bg-white/20 rounded-lg p-3 text-center">
                                    <p className="text-3xl font-bold">{mockLivingInfo.weather.avgTemp.winter}°C</p>
                                    <p className="text-sm opacity-80">Winter Avg</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alumni Tab */}
                {activeTab === "alumni" && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <p className="text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2">
                                <span className="text-lg">💡</span>
                                Connect with alumni who were once in your shoes. Get firsthand advice about life at this university!
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {mockAlumni.map((alumni, index) => (
                                <div
                                    key={alumni.id}
                                    className={`bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 animate-fadeInUp stagger-${index + 1}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                            {alumni.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white">{alumni.name}</h4>
                                                    <p className="text-sm text-slate-500">
                                                        {alumni.currentRole} at {alumni.company}
                                                    </p>
                                                </div>
                                                {alumni.openToConnect && (
                                                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                        Open to connect
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-slate-500 mb-3">
                                                📚 {alumni.program} • 🎓 Class of {alumni.graduationYear} • 🌍 From {alumni.country}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {alumni.topics.map((topic, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full"
                                                    >
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex gap-2">
                                                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2">
                                                    <span>💬</span> Request Chat
                                                </button>
                                                <button className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                    <span>📧</span> Send Message
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Call to action */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white text-center">
                            <h3 className="text-lg font-bold mb-2">Are you an alumnus?</h3>
                            <p className="text-indigo-100 mb-4">Help future students by sharing your experience</p>
                            <button className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition">
                                Join as Alumni Mentor
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
