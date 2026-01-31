"use client";

import { useState, useEffect } from "react";

type AnimatedCounterProps = {
    value: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
};

export function AnimatedCounter({
    value,
    duration = 1000,
    suffix = "",
    prefix = "",
    className = "",
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(Math.floor(easeOutQuart * value));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return (
        <span className={className}>
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
        </span>
    );
}

// Animated progress ring
type ProgressRingProps = {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    className?: string;
    color?: string;
    showPercentage?: boolean;
    children?: React.ReactNode;
};

export function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    className = "",
    color = "stroke-indigo-500",
    showPercentage = true,
    children,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background circle */}
                <circle
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    className={`${color} transition-all duration-500 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children ?? (
                    showPercentage && (
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {Math.round(progress)}%
                        </span>
                    )
                )}
            </div>
        </div>
    );
}

// XP bar with level
type XPBarProps = {
    currentXP: number;
    maxXP: number;
    level: number;
    className?: string;
};

export function XPBar({ currentXP, maxXP, level, className = "" }: XPBarProps) {
    const percentage = Math.min((currentXP / maxXP) * 100, 100);

    return (
        <div className={`${className}`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                            {level}
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-[8px]">⭐</span>
                        </div>
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Level {level}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
                </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out relative"
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
            </div>
        </div>
    );
}

// Streak counter
type StreakCounterProps = {
    streak: number;
    className?: string;
};

export function StreakCounter({ streak, className = "" }: StreakCounterProps) {
    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <div className="relative">
                <span className="text-2xl animate-bounce">🔥</span>
                {streak >= 7 && (
                    <span className="absolute -top-1 -right-1 text-sm">✨</span>
                )}
            </div>
            <div>
                <p className="text-lg font-bold text-orange-500">{streak}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1">day streak</p>
            </div>
        </div>
    );
}

// Achievement badge
type AchievementBadgeProps = {
    icon: string;
    title: string;
    description: string;
    unlocked: boolean;
    rarity?: "common" | "rare" | "epic" | "legendary";
    className?: string;
};

const rarityColors = {
    common: "from-slate-400 to-slate-500 ring-slate-400",
    rare: "from-blue-400 to-blue-600 ring-blue-400",
    epic: "from-purple-400 to-purple-600 ring-purple-400",
    legendary: "from-yellow-400 to-orange-500 ring-yellow-400",
};

export function AchievementBadge({
    icon,
    title,
    description,
    unlocked,
    rarity = "common",
    className = "",
}: AchievementBadgeProps) {
    return (
        <div
            className={`relative group ${className} ${unlocked ? "cursor-pointer" : "opacity-50 grayscale"
                }`}
        >
            <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${rarityColors[rarity]} flex items-center justify-center text-2xl shadow-lg transition-all ${unlocked
                        ? "ring-2 ring-offset-2 ring-offset-slate-900 hover:scale-110 hover:shadow-xl"
                        : ""
                    }`}
            >
                {unlocked ? icon : "🔒"}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[120px]">
                <p className="text-xs font-semibold text-white">{title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>
                {unlocked && (
                    <p className="text-[10px] text-emerald-400 mt-1">✓ Unlocked!</p>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </div>
        </div>
    );
}

// Typing animation for AI messages
type TypingAnimationProps = {
    text: string;
    speed?: number;
    onComplete?: () => void;
    className?: string;
};

export function TypingAnimation({
    text,
    speed = 30,
    onComplete,
    className = "",
}: TypingAnimationProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex]);
                setCurrentIndex((prev) => prev + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    return (
        <span className={className}>
            {displayedText}
            {currentIndex < text.length && (
                <span className="inline-block w-0.5 h-4 bg-current animate-blink ml-0.5" />
            )}
        </span>
    );
}

// Floating particles background
export function FloatingParticles({ count = 20 }: { count?: number }) {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-indigo-500/20 dark:bg-indigo-400/20 rounded-full animate-float"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${10 + Math.random() * 20}s`,
                    }}
                />
            ))}
        </div>
    );
}
