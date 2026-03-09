# Image Handling Documentation

This document describes the end-to-end process of how images (photos) are handled in the VFD Management System, from upload to storage and display.

## Overview

The system uses a hybrid approach:
- **Metadata**: Stored in a PostgreSQL database (`vfd.repair_images` table).
- **Physical Storage**: Managed on a Windows Network Share (SMBv1) for long-term persistence and organization.
- **Frontend**: A specialized React component handles authenticated fetching and display.

---

## 1. Backend Implementation

### Storage Strategy (SMB)
Because the target storage is a legacy SMBv1 share, the backend uses a native Windows approach:
- **Authentication**: Uses `net use` via `child_process.exec` to authenticate with the share.
- **Path Construction**: Folders are automatically created using the pattern:
  `[ClientName]-[InternalID]-[Model]-[EntryDate]/PHOTOS`
- **Utility**: `backend/utils/smbClient.js` handles connection, file copying (`fs.copyFileSync`), and reading (`fs.readFileSync`).

### API Endpoints
Defined in `backend/routes/images.js`:
- `POST /api/images/upload`: Authenticated upload.
- `GET /api/images/repair/:repairId`: List all images for a specific repair.
- `GET /api/images/serve/:repairId/:filename`: Stream an image from SMB to the client.
- `DELETE /api/images/:id`: Remove image from both SMB and database.

### The Upload Process
When a technician uploads a photo:
1. **Multer Middleware**: Receives the file and stores it in a temporary local `uploads/` directory.
2. **Controller (`uploadImage`)**:
   - Queries repair metadata to determine the correct SMB folder.
   - Calls `smbClient.uploadFile` to copy the file to the share.
   - Deletes the local temporary file.
   - Records the "Service Path" in the database (e.g., `/api/images/serve/12/photo.jpg`).

### The Serving Process
Images are protected and not served as static files:
1. **`serveImage` Controller**:
   - Authenticates the request (JWT middleware).
   - Locates the file on the SMB share.
   - Reads the file into a buffer.
   - Sets the correct `Content-Type` (image/jpeg or image/png).
   - Streams the buffer to the response.

---

## 2. Frontend Implementation

### `AuthenticatedImage` Component
Since images are served via an authenticated route, standard `<img src="...">` tags cannot be used directly (as they don't send the Authorization header).

**File**: `frontend/src/components/AuthenticatedImage.jsx`

**How it works**:
1. **Fetch**: Uses the `api` service (Axios wrapper with interceptors) to request the image.
2. **Blob**: Requests the response type as `blob`.
3. **URL Creation**: Converts the binary blob into a temporary local URL using `URL.createObjectURL(response.data)`.
4. **Lifecycle**:
   - Displays a pulse loader while fetching.
   - Revokes the `objectUrl` when the component unmounts to prevent memory leaks.

### Integration in Repairs
The `RepairDetail` page or workflow components use the `AuthenticatedImage` component whenever an image from the server needs to be displayed, passing the `file_path` stored in the database.

---

## 3. Database Schema

The `vfd.repair_images` table tracks the relationship between repairs and their files.

```sql
CREATE TABLE vfd.repair_images (
    id SERIAL PRIMARY KEY,
    repair_id INTEGER REFERENCES vfd.repairs(id),
    step_name VARCHAR(50),      -- e.g., 'Disassembly', 'Cleanup'
    file_path TEXT NOT NULL,    -- Virtual path: /api/images/serve/...
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
