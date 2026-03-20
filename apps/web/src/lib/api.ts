/**
 * Thin fetch wrapper for the SnapStudy API Gateway.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/* ── helpers ─────────────────────────────────────────────── */

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("snapstudy_token");
}

async function request<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Only set Content-Type for non-FormData bodies
    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        let message = "Request failed";
        if (typeof body.detail === "string") {
            message = body.detail;
        } else if (Array.isArray(body.detail)) {
            message = body.detail.map((d: any) => d.msg ?? JSON.stringify(d)).join("; ");
        } else if (body.detail) {
            message = JSON.stringify(body.detail);
        }
        throw new ApiError(res.status, message);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/* ── types ───────────────────────────────────────────────── */

export interface User {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface Subject {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    color_hex: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface Chapter {
    id: string;
    subject_id: string;
    name: string;
    description: string | null;
    weight: number;
    display_order: number;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface Progress {
    id: string;
    user_id: string;
    subject_id: string;
    total_weight: number;
    completed_weight: number;
    completion_pct: number;
    last_calculated_at: string;
}

export interface Note {
    id: string;
    topic_id: string;
    user_id: string;
    blob_url: string;
    file_name: string;
    file_size_kb: number | null;
    mime_type: string;
    caption: string | null;
    ocr_text: string | null;
    ai_summary: string | null;
    page_number: number;
    created_at: string;
    updated_at: string;
}

export interface SummaryResponse {
    id: string;
    ai_summary: string;
}

/* ── api object ──────────────────────────────────────────── */

export const api = {
    auth: {
        register: (email: string, display_name: string, password: string) =>
            request<AuthResponse>("/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, display_name, password }),
            }),

        login: (email: string, password: string) =>
            request<AuthResponse>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            }),

        me: () => request<User>("/auth/me"),
    },

    subjects: {
        list: (userId: string) =>
            request<Subject[]>(`/api/subjects/?user_id=${userId}`),

        create: (userId: string, data: { name: string; color_hex?: string; description?: string }) =>
            request<Subject>(`/api/subjects/?user_id=${userId}`, {
                method: "POST",
                body: JSON.stringify(data),
            }),

        get: (id: string) => request<Subject>(`/api/subjects/${id}`),

        update: (id: string, data: Partial<Subject>) =>
            request<Subject>(`/api/subjects/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            }),

        delete: (id: string) =>
            request<void>(`/api/subjects/${id}`, { method: "DELETE" }),
    },

    chapters: {
        list: (subjectId: string) =>
            request<Chapter[]>(`/api/chapters/?subject_id=${subjectId}`),

        create: (data: { subject_id: string; name: string; weight?: number }) =>
            request<Chapter>("/api/chapters/", {
                method: "POST",
                body: JSON.stringify(data),
            }),

        update: (id: string, data: Partial<Chapter>) =>
            request<Chapter>(`/api/chapters/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            }),

        delete: (id: string) =>
            request<void>(`/api/chapters/${id}`, { method: "DELETE" }),
    },

    progress: {
        get: (subjectId: string, userId: string) =>
            request<Progress>(`/api/progress/${subjectId}?user_id=${userId}`),
    },

    notes: {
        list: (userId: string, topicId?: string) => {
            let url = `/api/notes/?user_id=${userId}`;
            if (topicId) url += `&topic_id=${topicId}`;
            return request<Note[]>(url);
        },

        upload: (userId: string, file: File, topicId?: string, caption?: string) => {
            const form = new FormData();
            form.append("file", file);
            if (topicId) form.append("topic_id", topicId);
            if (caption) form.append("caption", caption);
            return request<Note>(`/api/notes/?user_id=${userId}`, {
                method: "POST",
                body: form,
            });
        },

        delete: (id: string) =>
            request<void>(`/api/notes/${id}`, { method: "DELETE" }),

        summarize: (noteId: string) =>
            request<SummaryResponse>(`/api/notes/${noteId}/summarize`, {
                method: "POST",
            }),
    },
};
