"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, API_BASE, type Note } from "@/lib/api";
import {
    Upload,
    Image as ImageIcon,
    FileText,
    Trash2,
    X,
    Sparkles,
    Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function NotesPage() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [dragOver, setDragOver] = useState(false);
    
    // Sidebar AI feature state
    const [summarizingId, setSummarizingId] = useState<string | null>(null);
    const [activeSummaryNote, setActiveSummaryNote] = useState<Note | null>(null);
    
    // Error state purely for display
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        api.notes.list(user.id).then(setNotes).catch(() => { }).finally(() => setLoading(false));
    }, [user]);

    async function handleUpload(files: FileList | null) {
        if (!files || !user) return;
        setUploading(true);
        for (const file of Array.from(files)) {
            try {
                // Upload without a topic_id
                const note = await api.notes.upload(user.id, file);
                setNotes((prev) => [note, ...prev]);
            } catch { /* handle error */ }
        }
        setUploading(false);
    }

    async function deleteNote(noteId: string) {
        await api.notes.delete(noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        if (selectedNote?.id === noteId) setSelectedNote(null);
        if (activeSummaryNote?.id === noteId) setActiveSummaryNote(null);
    }

    async function handleSummarize(note: Note) {
        setActiveSummaryNote(note);
        setSummaryError(null);

        // If we already have a successful summary in the database, just render it!
        const isErrorStr = note.ai_summary?.startsWith("[Summary Error]");
        if (note.ai_summary && !isErrorStr) {
            return;
        }

        setSummarizingId(note.id);

        try {
            const result = await api.notes.summarize(note.id);
            // Result is now saved in Postgres by the backend and returned
            
            // Update the note in our local state
            setNotes((prev) =>
                prev.map((n) =>
                    n.id === note.id ? { ...n, ai_summary: result.ai_summary } : n
                )
            );
            
            // Re-select in the active sidebar to instantly show the updated object
            setActiveSummaryNote((prev) => prev ? { ...prev, ai_summary: result.ai_summary } : prev);
            
            if (selectedNote?.id === note.id) {
                setSelectedNote((prev) => prev ? { ...prev, ai_summary: result.ai_summary } : prev);
            }
        } catch {
            setSummaryError("Failed to generate summary. Please try again.");
        } finally {
            setSummarizingId(null);
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-8 overflow-hidden bg-background">
            {/* Main content area */}
            <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
                <h1 className="mb-6 text-2xl font-bold">Photo Notes</h1>

                {/* Upload area */}
                <div
                    className={`mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all ${dragOver
                        ? "border-brand-500 bg-brand-500/5"
                        : "border-surface-border bg-surface-raised/50 hover:border-brand-500/50"
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleUpload(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => handleUpload(e.target.files)}
                    />
                    <Upload
                        size={32}
                        className={`mb-3 ${dragOver ? "text-brand-400" : "text-text-muted"}`}
                    />
                    <p className="font-medium text-text-secondary">
                        {uploading ? "Uploading…" : "Drop photos here or click to browse"}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                        Supports JPEG, PNG — AI will extract and summarize your notes
                    </p>
                </div>

                {/* Notes grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-12">
                        <ImageIcon size={40} className="mx-auto mb-3 text-text-muted" />
                        <p className="text-text-secondary">No notes yet. Upload your first photo!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                        {notes.map((note, i) => (
                            <div
                                key={note.id}
                                className={`group animate-fade-in rounded-xl border transition-all overflow-hidden bg-surface-raised cursor-pointer ${activeSummaryNote?.id === note.id ? 'border-brand-500 ring-1 ring-brand-500' : 'border-surface-border hover:border-surface-hover hover:shadow-lg'}`}
                                style={{ animationDelay: `${i * 60}ms` }}
                                onClick={() => handleSummarize(note)}
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-[4/3] bg-surface-overlay">
                                    <img
                                        src={note.blob_url.startsWith('/') ? API_BASE + note.blob_url : note.blob_url}
                                        alt={note.file_name}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-between p-3 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedNote(note);
                                            }}
                                            className="text-white bg-black/50 p-1.5 rounded-lg hover:bg-black/80 backdrop-blur-sm text-xs"
                                        >
                                            View Image
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                            className="text-white bg-danger/50 p-1.5 rounded-lg hover:bg-danger/80 backdrop-blur-sm transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {/* Info */}
                                <div className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-text-primary">
                                                {note.file_name}
                                            </p>
                                        </div>
                                    </div>
                                    {/* AI Summary Button */}
                                    <button
                                        disabled={summarizingId === note.id}
                                        className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${note.ai_summary ? 'bg-brand-500 text-white border-brand-500' : 'bg-brand-500/5 text-brand-400 border-brand-500/30 hover:bg-brand-500/10'} disabled:opacity-50 disabled:cursor-wait`}
                                    >
                                        {summarizingId === note.id ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Analyzing…
                                            </>
                                        ) : note.ai_summary ? (
                                            <>
                                                <Sparkles size={14} />
                                                View Summary
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={14} />
                                                AI Summary
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar for AI Summary */}
            <div className={`w-96 border-l border-surface-border bg-surface flex flex-col transition-all duration-300 transform ${activeSummaryNote ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 -mr-96"}`}>
                {activeSummaryNote && (
                    <>
                        <div className="shrink-0 sticky top-0 bg-surface flex items-center justify-between border-b border-surface-border px-6 py-4">
                            <h2 className="flex items-center gap-2 text-lg font-bold">
                                <Sparkles size={20} className="text-brand-400" />
                                AI Summary
                            </h2>
                            <button
                                onClick={() => setActiveSummaryNote(null)}
                                className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-4">
                                <img
                                    src={activeSummaryNote.blob_url.startsWith('/') ? API_BASE + activeSummaryNote.blob_url : activeSummaryNote.blob_url}
                                    className="w-full rounded-xl shadow-md border border-surface-border aspect-video object-cover"
                                    onClick={() => setSelectedNote(activeSummaryNote)}
                                />
                                <p className="text-sm font-semibold text-text-secondary truncate">{activeSummaryNote.file_name}</p>
                            </div>

                            <div className="relative">
                                {summarizingId === activeSummaryNote.id ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-surface-raised border border-surface-border">
                                        <Loader2 size={32} className="animate-spin text-brand-400 mb-4" />
                                        <p className="text-text-secondary font-medium text-sm">Our AI is analyzing this image…</p>
                                        <p className="text-xs text-text-muted mt-2">This may take up to a minute depending on image details.</p>
                                    </div>
                                ) : activeSummaryNote.ai_summary?.startsWith("[Summary Error]") || summaryError ? (
                                    <div className="p-4 rounded-xl bg-danger/10 text-danger border border-danger/20 text-sm whitespace-pre-wrap">
                                        {summaryError || activeSummaryNote.ai_summary}
                                        <button 
                                            onClick={() => handleSummarize(activeSummaryNote)}
                                            className="mt-2 block text-xs underline font-medium hover:text-white"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : activeSummaryNote.ai_summary ? (
                                    <div className="prose prose-sm prose-invert p-5 rounded-xl bg-brand-500/5 border border-brand-500/20 text-text-primary leading-relaxed">
                                        <ReactMarkdown>
                                            {activeSummaryNote.ai_summary}
                                        </ReactMarkdown>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* OCR/Original Image view modal */}
            {selectedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNote(null)}>
                    <div className="animate-fade-in relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-surface-border bg-surface-raised shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-raised px-6 py-4">
                            <h2 className="text-lg font-bold truncate pr-4">{selectedNote.file_name}</h2>
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6">
                            <img
                                src={selectedNote.blob_url.startsWith('/') ? API_BASE + selectedNote.blob_url : selectedNote.blob_url}
                                alt={selectedNote.file_name}
                                className="w-full h-auto max-h-[70vh] object-contain rounded-lg border border-surface-border"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
