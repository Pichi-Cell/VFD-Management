# Data Flow Diagrams

These diagrams explain how information moves through the system for key processes.

## 1. Authentication Flow
```mermaid
sequenceDiagram
    participant U as User (Frontend)
    participant A as Auth Controller (Backend)
    participant D as Database

    U->>A: Login Request (credentials)
    A->>D: Find user by username
    D-->>A: User record + hashed pass
    A->>A: Validate password (bcrypt)
    alt Valid
        A-->>U: Return JWT Token + User Info
    else Invalid
        A-->>U: Error 400 (Invalid credentials)
    end
```

## 2. Repair Lifecycle Flow
```mermaid
graph TD
    A[Reception] -->|New Repair Created| B(Kanban: Received)
    B --> C{Technical Process}
    C -->|Testing| D[Testing]
    D -->|Disassembly| E[Disassembled]
    E -->|Diagnosis| F[Diagnosed]
    F -->|Assembly| G[Assembled]
    G -->|Final Check| H[Finished]
    H -->|Report Generation| I[Tech Report PDF]
```

## 3. Repair Data Persistence (Sanitization & Sync)
```mermaid
sequenceDiagram
    participant F as Frontend (RepairDetail)
    participant B as Backend (repairController)
    participant D as Database

    F->>B: Update Repair Data (JSON)
    rect rgb(240, 240, 240)
    Note over B: Sanitization Layer
    B->>B: Convert empty strings to NULL (run_hours, etc.)
    end
    B->>D: UPDATE vfd.repairs
    D-->>B: Row updated
    B-->>F: Success Response
    F->>F: Invalidate TanStack Query ['repairs']
```

## 4. Settings Management (Admin Only)
```mermaid
graph LR
    subgraph Frontend
    S[Settings Page] -->|Tabs| U[User Mgmt]
    S -->|Tabs| C[Client Mgmt]
    S -->|Tabs| M[VFD Models Mgmt]
    end
    
    subgraph Backend
    U -->|POST /api/auth/register| AU[Auth Controller]
    C -->|POST /api/clients| CC[Client Controller]
    M -->|POST /api/vfds/models| VC[VFD Controller]
    end

    AU --> DB[(PostgreSQL)]
    CC --> DB
    VC --> DB
```
