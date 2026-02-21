# SnapStudy — Architecture

> A categorised photo-note system with weighted progress tracking, OCR, and visual analytics.

---

## 1. High-Level Overview

```mermaid
graph TB
    subgraph Client
        WEB["Next.js Frontend<br/>:3000"]
    end

    subgraph "API Layer"
        GW["API Gateway<br/>(FastAPI) :4000"]
    end

    subgraph "Microservices"
        NS["Notes Service<br/>(FastAPI) :4001"]
        PS["Progress Service<br/>(FastAPI) :4002"]
    end

    subgraph "Data & Storage"
        PG[("PostgreSQL 16")]
        BLOB["Azure Blob Storage"]
        OCR["Azure AI<br/>Document Intelligence"]
    end

    WEB -- "REST / JSON" --> GW
    GW -- "JWT verify" --> GW
    GW -- "httpx proxy" --> NS
    GW -- "httpx proxy" --> PS
    NS -- "SQLModel" --> PG
    PS -- "SQLModel" --> PG
    NS -- "Upload / Delete" --> BLOB
    NS -- "prebuilt-read" --> OCR
```

---

## 2. Monorepo Structure

```
snapstudy/
├── apps/
│   ├── web/                        # Next.js 15 frontend (TypeScript)
│   ├── api-gateway/                # FastAPI — auth, routing
│   ├── notes-service/              # FastAPI — photo-notes CRUD, OCR
│   └── progress-service/           # FastAPI — subjects, chapters, progress
│
├── packages/
│   ├── db-migrations/              # Alembic — centralised migrations
│   └── shared-models/              # Pydantic — API contract schemas
│
├── k8s/
│   ├── base/                       # Kustomize base manifests
│   ├── overlays/dev/               # Dev overlay (Spot Instances)
│   └── scripts/                    # AKS start / stop automation
│
├── docker-compose.yaml             # Local development (Compose V1)
├── turbo.json                      # Turborepo config (web only)
├── pnpm-workspace.yaml             # pnpm workspace (web only)
├── package.json                    # Root scripts
├── .env.example                    # Environment template
└── .gitignore
```

### Tooling

| Concern | Tool |
|---|---|
| Node package manager | **pnpm** |
| Monorepo orchestration | **Turborepo** (for `apps/web` builds) |
| Python packaging | **pyproject.toml** + `pip` per service |
| Containerisation | **Docker** per service |
| Local dev | **docker-compose** (V1) |
| Production deploy | **Kubernetes** (AKS) via Kustomize |

---

## 3. Services

### 3.1 API Gateway (`apps/api-gateway`)

| Property | Value |
|---|---|
| Framework | FastAPI |
| Port | 4000 |
| Role | Authentication, request routing |

**Key modules:**

| File | Responsibility |
|---|---|
| `src/main.py` | FastAPI app + health check |
| `src/config.py` | Env config (DB, JWT, service URLs) |
| `src/middleware/auth.py` | JWT creation + verification (PyJWT) |
| `src/routes/` | Proxy routes to downstream services |

**Auth flow:**
```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant DB as PostgreSQL

    C->>GW: POST /auth/register {email, password}
    GW->>DB: INSERT INTO users
    GW->>C: 201 {token}

    C->>GW: POST /auth/login {email, password}
    GW->>DB: SELECT * FROM users WHERE email=...
    GW->>GW: Verify bcrypt hash
    GW->>C: 200 {token}

    C->>GW: GET /api/subjects (Authorization: Bearer ...)
    GW->>GW: verify_token() → user_id
    GW->>PS: GET /subjects?user_id=...
    PS->>GW: [{subjects}]
    GW->>C: 200 [{subjects}]
```

---

### 3.2 Notes Service (`apps/notes-service`)

| Property | Value |
|---|---|
| Framework | FastAPI |
| Port | 4001 |
| Role | Photo-note CRUD, blob storage, OCR |

**Key modules:**

| File | Responsibility |
|---|---|
| `src/main.py` | FastAPI app + lifespan DB init |
| `src/database.py` | SQLModel engine + session DI |
| `src/models/note.py` | `PhotoNote` SQLModel class |
| `src/services/blob_storage.py` | Azure Blob upload / delete |
| `src/services/ocr.py` | Azure AI Document Intelligence integration |

**Upload + OCR flow:**
```mermaid
sequenceDiagram
    participant C as Client
    participant NS as Notes Service
    participant BLOB as Azure Blob
    participant OCR as Azure AI Doc Intel
    participant DB as PostgreSQL

    C->>NS: POST /notes (multipart: image + metadata)
    NS->>BLOB: upload_blob(key, data)
    BLOB-->>NS: blob_url
    NS->>OCR: extract_text_from_image(data)
    OCR-->>NS: ocr_text
    NS->>DB: INSERT INTO photo_notes
    NS->>C: 201 {note with ocr_text}
```

---

### 3.3 Progress Service (`apps/progress-service`)

| Property | Value |
|---|---|
| Framework | FastAPI |
| Port | 4002 |
| Role | Subjects, chapters, weighted progress calculation |

**Key modules:**

| File | Responsibility |
|---|---|
| `src/main.py` | FastAPI app + lifespan DB init |
| `src/database.py` | SQLModel engine + session DI |
| `src/models/subject.py` | `Subject` SQLModel class |
| `src/models/chapter.py` | `Chapter` SQLModel class (weight 1–10) |
| `src/models/user_progress.py` | `UserProgress` SQLModel class |
| `src/services/__init__.py` | `calculate_subject_progress()` |

**Weighted progress formula:**
```
completion_pct = SUM(weight WHERE is_completed=true) / SUM(weight) × 100
```

Example with 3 chapters:
| Chapter | Weight | Completed |
|---|---|---|
| Algebra | 3 | ✅ |
| Calculus | 8 | ❌ |
| Geometry | 4 | ✅ |
| **Total** | **15** | **7 / 15 = 46.67%** |

---

### 3.4 Web Frontend (`apps/web`)

| Property | Value |
|---|---|
| Framework | Next.js 15 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Port | 3000 |

Planned features:
- **Dashboard** — radial progress bars per subject
- **Gantt view** — exam deadline countdowns
- **Notes gallery** — grid of photo-notes with OCR preview
- **Subject/chapter management** — CRUD with colour coding

---

## 4. Database Schema

**Engine:** PostgreSQL 16 &nbsp;|&nbsp; **ORM:** SQLModel &nbsp;|&nbsp; **Migrations:** Alembic

```mermaid
erDiagram
    users ||--o{ subjects : owns
    users ||--o{ photo_notes : uploads
    users ||--o{ user_progress : tracks
    subjects ||--o{ chapters : contains
    subjects ||--o{ exam_deadlines : has
    subjects ||--o{ user_progress : measured_by
    chapters ||--o{ topics : contains
    topics ||--o{ photo_notes : has

    users {
        uuid id PK
        varchar email UK
        varchar display_name
        text avatar_url
        text password_hash
        timestamptz created_at
        timestamptz updated_at
    }

    subjects {
        uuid id PK
        uuid user_id FK
        varchar name
        text description
        varchar color_hex
        int display_order
        timestamptz created_at
        timestamptz updated_at
    }

    chapters {
        uuid id PK
        uuid subject_id FK
        varchar name
        text description
        smallint weight "1–10"
        int display_order
        boolean is_completed
        timestamptz created_at
        timestamptz updated_at
    }

    topics {
        uuid id PK
        uuid chapter_id FK
        varchar name
        int display_order
        boolean is_completed
        timestamptz created_at
        timestamptz updated_at
    }

    photo_notes {
        uuid id PK
        uuid topic_id FK
        uuid user_id FK
        text blob_url
        text blob_key
        varchar file_name
        int file_size_kb
        varchar mime_type
        text caption
        text ocr_text
        int page_number
        timestamptz created_at
        timestamptz updated_at
    }

    exam_deadlines {
        uuid id PK
        uuid subject_id FK
        varchar exam_name
        date exam_date
        timestamptz created_at
    }

    user_progress {
        uuid id PK
        uuid user_id FK
        uuid subject_id FK
        int total_weight
        int completed_weight
        numeric completion_pct
        timestamptz last_calculated_at
    }
```

**Migration file:** `packages/db-migrations/alembic/versions/001_initial.py`

---

## 5. Shared Packages

### 5.1 `packages/db-migrations` (Alembic)

Centralised database migrations consumed by all Python services via a Docker init container.

| File | Purpose |
|---|---|
| `alembic.ini` | Alembic config (URL overridden by `DATABASE_URL` env) |
| `alembic/env.py` | SQLModel metadata target + dotenv loading |
| `alembic/versions/001_initial.py` | Initial schema — 7 tables |
| `Dockerfile` | Slim Python image that runs `alembic upgrade head` |

### 5.2 `packages/shared-models` (Pydantic)

API contract schemas shared across services and consumed by the frontend.

| Schema | Create Model | Response Model |
|---|---|---|
| `subject.py` | `SubjectCreate` | `SubjectResponse` |
| `chapter.py` | `ChapterCreate` | `ChapterResponse` |
| `note.py` | `NoteCreate` | `NoteResponse` |
| `progress.py` | — | `ProgressResponse` |

All response models use `model_config = {"from_attributes": True}` for direct SQLModel → Pydantic serialisation.

---

## 6. Infrastructure

### 6.1 Local Development (Docker Compose)

```mermaid
graph LR
    subgraph "docker-compose.yaml"
        PG["postgres:16-alpine<br/>:5432"]
        MIG["migrate<br/>(alembic upgrade head)"]
        GW["api-gateway<br/>:4000"]
        NS["notes-service<br/>:4001"]
        PS["progress-service<br/>:4002"]
    end

    PG -- "healthcheck" --> MIG
    MIG -- "completed" --> GW
    MIG -- "completed" --> NS
    MIG -- "completed" --> PS
```

**Startup order:**
1. `postgres` starts → healthcheck (`pg_isready`)
2. `migrate` runs Alembic → exits 0
3. All 3 services start after migration completes

**Commands:**
```bash
cp .env.example .env              # First time only
docker-compose up -d              # Start everything
docker-compose logs -f api-gateway # Tail a service
docker-compose down               # Stop everything
```

### 6.2 Production (AKS / Kubernetes)

```
k8s/
├── base/
│   ├── namespace.yaml                # snapstudy namespace
│   ├── api-gateway-deployment.yaml   # 1 replica, 128Mi–256Mi
│   ├── notes-service-deployment.yaml # 1 replica, 128Mi–256Mi
│   ├── progress-service-deployment.yaml
│   ├── web-deployment.yaml           # Next.js, 128Mi–256Mi
│   ├── services.yaml                 # ClusterIP + LoadBalancer
│   └── kustomization.yaml
├── overlays/dev/
│   └── kustomization.yaml            # Spot Instance tolerations
└── scripts/
    ├── aks-start.sh                  # az aks start
    └── aks-stop.sh                   # az aks stop
```

**Budget strategy:**
| Technique | Saving |
|---|---|
| AKS Free Tier | $0 control plane |
| B-Series VMs | Low-cost burstable |
| Spot Instances | Up to 90% off (notes + progress) |
| AKS Start/Stop scripts | Shut down outside study hours |
| PostgreSQL Free Tier | 750 hrs/month free |

---

## 7. Environment Variables

```bash
# PostgreSQL
DATABASE_URL=postgresql://snapstudy:snapstudy@localhost:5432/snapstudy

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=photo-notes

# Azure AI Document Intelligence (OCR)
AZURE_FORM_RECOGNIZER_ENDPOINT=
AZURE_FORM_RECOGNIZER_KEY=

# Auth
JWT_SECRET=change-me-in-production

# Service ports
API_GATEWAY_PORT=4000
NOTES_SERVICE_PORT=4001
PROGRESS_SERVICE_PORT=4002

# Service discovery (Docker uses container names, local uses localhost)
NOTES_SERVICE_URL=http://localhost:4001
PROGRESS_SERVICE_URL=http://localhost:4002
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 8. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, Recharts, Lucide |
| Backend | Python, FastAPI, SQLModel, Uvicorn |
| Auth | JWT (PyJWT) + bcrypt (passlib) |
| Database | PostgreSQL 16 |
| ORM | SQLModel (SQLAlchemy + Pydantic) |
| Migrations | Alembic |
| Blob Storage | Azure Blob Storage SDK |
| OCR | Azure AI Document Intelligence (`prebuilt-read`) |
| Containers | Docker, docker-compose (local), Kubernetes (prod) |
| Orchestration | AKS, Kustomize |
| Monorepo | Turborepo + pnpm (web), pyproject.toml (Python) |
