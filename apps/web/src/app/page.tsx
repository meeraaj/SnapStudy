"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { GraduationCap } from "lucide-react";

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            router.replace(user ? "/dashboard" : "/login");
        }
    }, [user, loading, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex items-center gap-3 animate-pulse">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <GraduationCap size={24} />
                </div>
                <span className="text-2xl font-bold tracking-tight">SnapStudy</span>
            </div>
        </div>
    );
}
