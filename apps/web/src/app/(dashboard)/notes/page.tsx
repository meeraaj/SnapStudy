"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type Note } from "@/lib/api";
import {
    Upload,
    Image as ImageIcon,
    FileText,
    Trash2,
    X,
} from "lucide-react";

export default function NotesPage() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [dragOver, setDragOver] = useState(false);
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
                // Use a placeholder topic_id for now
                const note = await api.notes.upload(user.id, "00000000-0000-0000-0000-000000000000", file);
                setNotes((prev) => [note, ...prev]);
            } catch { /* handle error */ }
        }
        setUploading(false);
    }

    async function deleteNote(noteId: string) {
        await api.notes.delete(noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        if (selectedNote?.id === noteId) setSelectedNote(null);
    }

    return (
        <div className="animate-fade-in">
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
                    Supports JPEG, PNG — OCR will extract handwritten text
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
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    {notes.map((note, i) => (
                        <div
                            key={note.id}
                            className="group animate-fade-in rounded-xl border border-surface-border bg-surface-raised overflow-hidden transition-all hover:border-surface-hover hover:shadow-lg"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            {/* Thumbnail */}
                            <div
                                className="relative aspect-[4/3] bg-surface-overlay cursor-pointer"
                                onClick={() => setSelectedNote(note)}
                            >
                                <img
                                    src={note.blob_url}
                                    alt={note.file_name}
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {/* Info */}
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-text-primary">
                                        {note.file_name}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        {note.ocr_text ? (
                                            <span className="flex items-center gap-1">
                                                <FileText size={10} />
                                                OCR extracted
                                            </span>
                                        ) : (
                                            `${note.file_size_kb ?? 0} KB`
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={() => deleteNote(note.id)}
                                    className="rounded-lg p-1.5 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-danger/10 hover:text-danger"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* OCR preview modal */}
            {selectedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="animate-fade-in relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-surface-border bg-surface-raised shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-raised px-6 py-4">
                            <h2 className="text-lg font-bold">{selectedNote.file_name}</h2>
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-0">
                            <div className="border-r border-surface-border">
                                <img
                                    src={selectedNote.blob_url}
                                    alt={selectedNote.file_name}
                                    className="w-full"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                                    <FileText size={14} />
                                    Extracted Text (OCR)
                                </h3>
                                <div className="rounded-lg bg-surface p-4 text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                                    {selectedNote.ocr_text || "No text extracted yet."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
