# Database Schema Documentation

The system uses a highly structured PostgreSQL schema defined in the `vfd` namespace.

## Table Relationships

```mermaid
erDiagram
    CLIENTS ||--o{ VFDS : "owns"
    VFD_MODELS ||--o{ VFDS : "describes"
    VFDS ||--o{ REPAIRS : "undergoes"
    REPAIRS ||--o{ COMPONENT_STATES : "tracks"
    REPAIRS ||--o{ REPAIR_IMAGES : "contains"
    USERS ||--o{ REPAIRS : "assigned as technician"
    SETTINGS ||--o{ SETTINGS : "stores config"

    CLIENTS {
        integer id PK
        string name
        text contact_info
    }

    VFD_MODELS {
        integer id PK
        string brand
        string model
        string power
        string input_voltage
    }

    VFDS {
        integer id PK
        string serial_number
        string internal_number
        integer client_id FK
        integer model_id FK
    }

    REPAIRS {
        integer id PK
        integer vfd_id FK
        string status "Received, Testing, etc."
        string type "Approval, Service"
        integer technician_id FK
        integer run_hours
        integer connection_hours
        text reported_fault
        text disassembly_obs
        text measurement_obs
        text final_conclusion
        timestamp entry_date
    }

    SETTINGS {
        string key PK
        text value
        timestamp updated_at
    }
```

## Key Considerations
- **Sanitization**: Fields like `run_hours` and `connection_hours` MUST be handled as `integer` or `NULL` in the backend. Attempts to save empty strings `""` will cause a PostgreSQL error.
- **Images**: `repair_images` stores file paths relative to the `/uploads` directory.
- **Workflow**: `status` column drives the Kanban board positioning.
