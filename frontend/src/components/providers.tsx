"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import { AuthProvider } from "@/components/auth-context";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange={false}
        >
            <ToastProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
