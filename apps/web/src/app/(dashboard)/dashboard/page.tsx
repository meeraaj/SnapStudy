"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type Subject, type Progress } from "@/lib/api";
import ProgressRing from "@/components/progress-ring";
import { Plus, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

const SUBJECT_COLORS = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
    "#10B981", "#06B6D4", "#F97316", "#6366F1",
];

export default function DashboardPage() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [progress, setProgress] = useState<Record<string, Progress>>({});
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(SUBJECT_COLORS[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    async function loadData() {
        if (!user) return;
        setLoading(true);
        try {
            const subs = await api.subjects.list(user.id);
            setSubjects(subs);
            // Load progress for each subject
            const progMap: Record<string, Progress> = {};
            await Promise.allSettled(
                subs.map(async (s) => {
                    try {
                        const p = await api.progress.get(s.id, user.id);
                        progMap[s.id] = p;
                    } catch { /* no progress yet */ }
                }),
            );
            setProgress(progMap);
        } catch { /* handle error */ }
        setLoading(false);
    }

    async function createSubject(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !newName.trim()) return;
        await api.subjects.create(user.id, { name: newName, color_hex: newColor });
        setShowModal(false);
        setNewName("");
        loadData();
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {user?.display_name?.split(" ")[0]} 👋
                </h1>
                <p className="mt-1 text-text-secondary">
                    Here&apos;s your study progress overview
                </p>
            </div>

            {/* Stats row */}
            <div className="mb-8 grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
                <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
                    <p className="text-sm text-text-secondary">Subjects</p>
                    <p className="mt-1 text-2xl font-bold">{subjects.length}</p>
                </div>
                <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
                    <p className="text-sm text-text-secondary">Avg Progress</p>
                    <p className="mt-1 text-2xl font-bold">
                        {subjects.length > 0
                            ? Math.round(
                                Object.values(progress).reduce((a, p) => a + p.completion_pct, 0) /
                                Math.max(Object.keys(progress).length, 1),
                            )
                            : 0}
                        %
                    </p>
                </div>
                <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
                    <p className="text-sm text-text-secondary">Completed</p>
                    <p className="mt-1 text-2xl font-bold">
                        {Object.values(progress).filter((p) => p.completion_pct >= 100).length}
                    </p>
                </div>
            </div>

            {/* Subject grid */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Subjects</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand-600/20 transition-all hover:bg-brand-500"
                >
                    <Plus size={16} />
                    Add Subject
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
            ) : subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-raised/50 py-16">
                    <Sparkles size={40} className="mb-3 text-text-muted" />
                    <p className="mb-1 text-lg font-medium text-text-secondary">No subjects yet</p>
                    <p className="text-sm text-text-muted">Add your first subject to start tracking progress</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((sub, i) => {
                        const prog = progress[sub.id];
                        const pct = prog?.completion_pct ?? 0;
                        const color = sub.color_hex ?? SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                        return (
                            <Link
                                key={sub.id}
                                href={`/subjects/${sub.id}`}
                                className="group animate-fade-in rounded-xl border border-surface-border bg-surface-raised p-5 transition-all hover:border-surface-hover hover:shadow-lg hover:shadow-black/20"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                                            style={{ backgroundColor: `${color}20` }}
                                        >
                                            <BookOpen size={18} style={{ color }} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-text-primary group-hover:text-brand-400 transition-colors">
                                                {sub.name}
                                            </h3>
                                            {sub.description && (
                                                <p className="mt-0.5 text-xs text-text-muted line-clamp-1">
                                                    {sub.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <ProgressRing percent={pct} size={56} strokeWidth={4} color={color} />
                                </div>
                                <div className="mt-4">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: color,
                                            }}
                                        />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Add Subject Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="animate-fade-in w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-2xl">
                        <h2 className="mb-4 text-lg font-bold">New Subject</h2>
                        <form onSubmit={createSubject} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                                    Subject Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Mathematics"
                                    className="w-full rounded-lg border border-surface-border bg-surface py-2.5 px-4 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                                    Color
                                </label>
                                <div className="flex gap-2">
                                    {SUBJECT_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewColor(c)}
                                            className={`h-8 w-8 rounded-full border-2 transition-all ${newColor === c ? "border-white scale-110" : "border-transparent"}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 rounded-lg border border-surface-border py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-500"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
