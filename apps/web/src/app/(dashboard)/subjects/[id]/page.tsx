"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, type Subject, type Chapter, type Progress } from "@/lib/api";
import ProgressRing from "@/components/progress-ring";
import {
    ArrowLeft,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    BookOpen,
} from "lucide-react";

export default function SubjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [subject, setSubject] = useState<Subject | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);

    // New chapter form
    const [showAdd, setShowAdd] = useState(false);
    const [newChapterName, setNewChapterName] = useState("");
    const [newChapterWeight, setNewChapterWeight] = useState(5);

    useEffect(() => {
        loadData();
    }, [id, user]);

    async function loadData() {
        if (!user || !id) return;
        setLoading(true);
        try {
            const [sub, chaps] = await Promise.all([
                api.subjects.get(id),
                api.chapters.list(id),
            ]);
            setSubject(sub);
            setChapters(chaps);
            try {
                const prog = await api.progress.get(id, user.id);
                setProgress(prog);
            } catch { /* no progress yet */ }
        } catch { /* error */ }
        setLoading(false);
    }

    async function toggleComplete(chapter: Chapter) {
        await api.chapters.update(chapter.id, {
            is_completed: !chapter.is_completed,
        });
        loadData();
    }

    async function addChapter(e: React.FormEvent) {
        e.preventDefault();
        if (!newChapterName.trim()) return;
        await api.chapters.create({
            subject_id: id,
            name: newChapterName,
            weight: newChapterWeight,
        });
        setNewChapterName("");
        setNewChapterWeight(5);
        setShowAdd(false);
        loadData();
    }

    async function deleteChapter(chapterId: string) {
        await api.chapters.delete(chapterId);
        loadData();
    }

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    const color = subject?.color_hex ?? "#3B82F6";
    const pct = progress?.completion_pct ?? 0;

    return (
        <div className="animate-fade-in max-w-3xl">
            {/* Back + title */}
            <button
                onClick={() => router.push("/dashboard")}
                className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Dashboard
            </button>

            {/* Header card */}
            <div className="mb-8 flex items-center justify-between rounded-2xl border border-surface-border bg-surface-raised p-6">
                <div className="flex items-center gap-4">
                    <div
                        className="flex h-14 w-14 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}20` }}
                    >
                        <BookOpen size={24} style={{ color }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{subject?.name}</h1>
                        {subject?.description && (
                            <p className="mt-0.5 text-sm text-text-secondary">{subject.description}</p>
                        )}
                    </div>
                </div>
                <ProgressRing percent={pct} size={80} strokeWidth={5} color={color} />
            </div>

            {/* Chapters */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    Chapters ({chapters.length})
                </h2>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-500"
                >
                    <Plus size={16} />
                    Add Chapter
                </button>
            </div>

            {/* Add chapter form */}
            {showAdd && (
                <form onSubmit={addChapter} className="mb-4 animate-fade-in rounded-xl border border-surface-border bg-surface-raised p-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            required
                            value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            placeholder="Chapter name"
                            className="flex-1 rounded-lg border border-surface-border bg-surface py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-text-secondary">Weight:</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={newChapterWeight}
                                onChange={(e) => setNewChapterWeight(Number(e.target.value))}
                                className="w-16 rounded-lg border border-surface-border bg-surface py-2 px-3 text-sm text-text-primary focus:border-brand-500 focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-500"
                        >
                            Add
                        </button>
                    </div>
                </form>
            )}

            {/* Chapter list */}
            {chapters.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface-border py-12 text-center">
                    <p className="text-text-secondary">No chapters yet. Add one to start tracking!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {chapters.map((ch, i) => (
                        <div
                            key={ch.id}
                            className="group animate-fade-in flex items-center gap-4 rounded-xl border border-surface-border bg-surface-raised px-5 py-4 transition-all hover:border-surface-hover"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <button
                                onClick={() => toggleComplete(ch)}
                                className="transition-colors"
                            >
                                {ch.is_completed ? (
                                    <CheckCircle2 size={22} className="text-success" />
                                ) : (
                                    <Circle size={22} className="text-text-muted hover:text-text-secondary" />
                                )}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium ${ch.is_completed ? "text-text-muted line-through" : "text-text-primary"}`}>
                                    {ch.name}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                    style={{
                                        backgroundColor: `${color}20`,
                                        color,
                                    }}
                                >
                                    Weight: {ch.weight}
                                </span>
                                <button
                                    onClick={() => deleteChapter(ch.id)}
                                    className="rounded-lg p-1.5 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-danger/10 hover:text-danger"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
