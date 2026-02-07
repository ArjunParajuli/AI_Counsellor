"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type AuthContextType = {
    isLoggedIn: boolean;
    isOnboardingComplete: boolean | null;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    isOnboardingComplete: null,
    isLoading: true,
    checkAuth: async () => { },
});

export const useAuth = () => useContext(AuthContext);

// Pages that don't require onboarding
const PUBLIC_PATHS = ["/", "/auth/login", "/auth/signup", "/onboarding"];

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        const token = window.localStorage.getItem("token");

        if (!token) {
            setIsLoggedIn(false);
            setIsOnboardingComplete(null);
            setIsLoading(false);
            return;
        }

        setIsLoggedIn(true);

        try {
            const res = await fetch(`${API_BASE_URL}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setIsOnboardingComplete(data.is_complete === true);
            } else if (res.status === 404) {
                // Profile not found means onboarding not complete
                setIsOnboardingComplete(false);
            } else {
                // Other error (e.g., token invalid)
                setIsLoggedIn(false);
                setIsOnboardingComplete(null);
            }
        } catch {
            // Network error, assume logged in but unknown onboarding status
            setIsOnboardingComplete(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    // Redirect logic
    useEffect(() => {
        if (isLoading) return;

        const isPublicPath = PUBLIC_PATHS.some(
            (path) => pathname === path || pathname?.startsWith("/auth/")
        );

        // If logged in but onboarding not complete, redirect to onboarding
        if (isLoggedIn && isOnboardingComplete === false && !isPublicPath && pathname !== "/onboarding") {
            router.replace("/onboarding");
        }
    }, [isLoggedIn, isOnboardingComplete, isLoading, pathname, router]);

    return (
        <AuthContext.Provider value={{ isLoggedIn, isOnboardingComplete, isLoading, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}
