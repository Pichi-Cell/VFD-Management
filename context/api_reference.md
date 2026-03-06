# API Reference

All protected routes require an `x-auth-token` header with a valid JWT.

## Authentication (`/api/auth`)
- `POST /login`: Authenticate and get JWT.
- `POST /register`: Create new user (Admin only manually call).
- `GET /`: List all users.

## Repairs (`/api/repairs`)
- `GET /`: Get all repairs with related data (Client, Model, Tech Name).
- `GET /:id`: Get full detail of a specific repair (including component states and images).
- `POST /`: Create a new repair entry.
- `PUT /:id/stage`: Update repair progress (Kanban drag/drop).
- `PUT /:id/data`: Update technical observations and technical fields.
- `POST /:id/images`: Upload images for a specific repair step.

## Clients (`/api/clients`)
- `GET /`: List all clients.
- `POST /`: Add new client.

## VFDs & Models (`/api/vfds`)
- `GET /`: List all registered VFD units with serial numbers.
- `GET /models`: List all VFD models (Power, Brand, etc.).
- `POST /models`: Create a new VFD model.

## Communication (`/api/email`)
- `POST /send-report`: Sends the final technical report PDF/Summary to the client.
