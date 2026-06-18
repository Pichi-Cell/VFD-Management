# Configuration Inventory

This project uses both runtime environment variables and DB-backed settings in `vfd.settings`.

## Runtime Environment

These values are read from the process environment and require a backend restart after changes.

| Key | Default | Scope | Notes |
| --- | --- | --- | --- |
| `PORT` | `5000` | Backend env | HTTP port. |
| `DB_USER` | none | Backend env | PostgreSQL user. |
| `DB_HOST` | none | Backend env | PostgreSQL host. |
| `DB_NAME` | none | Backend env | PostgreSQL database. |
| `DB_PASSWORD` | none | Backend env | PostgreSQL password. |
| `DB_PORT` | `5432` | Backend env | PostgreSQL port. |
| `JWT_SECRET` | none | Backend env | Required signing secret. |
| `JWT_EXPIRES_IN` | `1d` | Backend env | JWT lifetime, passed to `jsonwebtoken`. |
| `CORS_ORIGIN` | unset | Backend env | Comma-separated allowed origins. Unset keeps development permissive. Requests with no `Origin` are allowed. |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` | Backend env | Multer image upload limit. |
| `VITE_API_BASE_URL` | `/api` | Frontend build env | Build-time Axios base URL. Use `/api` for Docker/Nginx or Vite proxy; use `http://localhost:5000/api` if bypassing the proxy. |

## DB-Backed Settings

These values are stored in `vfd.settings`. Environment values for storage/email can seed the DB when missing. Admin-editable values do not require a backend restart after saving because the services reinitialize.

| Key | Default | Source Order | Setup-Time | Admin-Editable | Notes |
| --- | --- | --- | --- | --- | --- |
| `STORAGE_TYPE` | `LOCAL` | DB, env, default | yes | yes | Allowed: `LOCAL`, `SMB`. |
| `UPLOAD_DIR` | `/app/uploads` | DB, env, default | yes | yes | Canonical upload directory key. `UPLOADS_DIR` is only a temporary env fallback. |
| `SMB_HOST` | empty | DB, env, default | yes | yes | Required when `STORAGE_TYPE=SMB`. |
| `SMB_SHARE` | empty | DB, env, default | yes | yes | Required when `STORAGE_TYPE=SMB`. |
| `SMB_USER` | empty | DB, env, default | yes | yes | Required when `STORAGE_TYPE=SMB`. |
| `SMB_PASS` | empty | DB, env, default | yes | yes | Secret. Returned blank from `/api/config`; blank saves preserve the stored value. |
| `SMB_BASE_PATH` | empty | DB, env, default | yes | yes | Optional subfolder below the share. |
| `EMAIL_HOST` | `smtp.gmail.com` | DB, env, default | yes | yes | SMTP host. |
| `EMAIL_PORT` | `587` | DB, env, default | yes | yes | Integer port. |
| `EMAIL_SECURE` | `false` | DB, env, default | yes | yes | Boolean string. |
| `EMAIL_USER` | empty | DB, env, default | yes | yes | SMTP username and default fallback recipient. |
| `EMAIL_PASS` | empty | DB, env, default | yes | yes | Secret. Returned blank from `/api/config`; blank saves preserve the stored value. |
| `EMAIL_REJECT_UNAUTHORIZED` | `true` | DB, env, default | yes | yes | Set `false` for legacy/self-signed SMTP TLS. |
| `EMAIL_FROM_NAME` | `VFD Workflow` | DB, env, default | no | yes | Sender display name. |
| `BRAND_COMPANY_NAME` | `DMD Compresores` | DB, default | no | yes | PDF and email branding. |
| `BRAND_DEPARTMENT_NAME` | `Depto. de Desarrollo` | DB, default | no | yes | PDF header/signature. |
| `REPORT_TITLE` | `Informe Técnico` | DB, default | no | yes | PDF report title. |
| `REPORT_FOOTER_TEXT` | `Documento generado por el sistema de gestión de variadores - DMD Compresores` | DB, default | no | yes | PDF footer. |
| `EMAIL_SIGNATURE_NAME` | `Departamento de Desarrollo` | DB, default | no | yes | Notification email signature line. |

## Uploads

Image uploads accept only `image/jpeg`, `image/png`, and `image/webp`. The size limit is controlled by `MAX_UPLOAD_SIZE_BYTES`.
