"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type Subject } from "@/lib/api";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

const SUBJECT_COLORS = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
    "#10B981", "#06B6D4", "#F97316", "#6366F1",
];

export default function SubjectsListPage() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        api.subjects.list(user.id).then(setSubjects).finally(() => setLoading(false));
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">All Subjects</h1>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-500"
                >
                    <Plus size={16} />
                    Add from Dashboard
                </Link>
            </div>

            <div className="space-y-3">
                {subjects.map((sub, i) => {
                    const color = sub.color_hex ?? SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                    return (
                        <Link
                            key={sub.id}
                            href={`/subjects/${sub.id}`}
                            className="group flex items-center gap-4 rounded-xl border border-surface-border bg-surface-raised p-5 transition-all hover:border-surface-hover hover:shadow-lg hover:shadow-black/10 animate-fade-in"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${color}20` }}
                            >
                                <BookOpen size={20} style={{ color }} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-text-primary group-hover:text-brand-400 transition-colors">
                                    {sub.name}
                                </h3>
                                {sub.description && (
                                    <p className="mt-0.5 text-sm text-text-muted">{sub.description}</p>
                                )}
                            </div>
                            <div className="text-sm text-text-muted">
                                {new Date(sub.created_at).toLocaleDateString()}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
