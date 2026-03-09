# Email Handling Documentation

This document describes the process of how emails (SMTP) are configured and sent in the VFD Management System.

## Overview

The system uses a highly configurable approach for sending emails to support both modern and legacy SMTP internal servers.
- **Service**: A singleton `EmailService` class handles initialization, connection, and sending.
- **Provider**: Uses `nodemailer` under the hood.
- **Configuration Persistence**: Reads configuration from the `vfd.settings` database table first. If settings are missing in the DB but present in the `.env` file, they are automatically persisted to the database for future use.

---

## 1. Configuration Strategy

The configuration logic prioritize sources in this order: **Database -> Environment Variables -> Sensible Defaults**.

### Supported Keys
The following keys are stored in the `vfd.settings` table (or initially provided via `.env`):
- `EMAIL_HOST`: The SMTP server host (e.g., `smtp.gmail.com` or a local IP).
- `EMAIL_PORT`: The SMTP port (e.g., `587` for TLS, `25` for legacy).
- `EMAIL_SECURE`: Boolean string (`true` or `false`). True typically for port 465.
- `EMAIL_USER`: The sender's email address or username.
- `EMAIL_PASS`: The sender's password or app password.
- `EMAIL_REJECT_UNAUTHORIZED`: Boolean string (`true` or `false`). This is crucial for legacy servers without proper SSL/TLS certificates. Setting this to `false` allows connecting without rejecting self-signed or missing certificates.

### Initialization `init()`
When the backend starts (or right before sending an email), `EmailService.init()` is called.
1. It queries `SELECT key, value FROM vfd.settings`.
2. It assigns the values to its configuration object, falling back to `process.env`.
3. If an environment variable was used that didn't exist in the database, it inserts it into `vfd.settings`.
4. Finally, it creates the `nodemailer` transporter.

---

## 2. API & Usage

### `EmailService.sendEmail(to, subject, html, attachments)`
A generic method to send any email securely. It ensures the service is initialized before dispatching the message.

### `EmailService.sendRepairFinishedEmail(repair, clientEmail)`
Sends a predefined email notifying the client that a repair has been completed, including observations and a generated PDF report attached.

### `emailController.js`
Exposes the `/api/email/repair/:repairId` endpoint which:
1. Gathers deep database information for the repair, VFD, and client.
2. Generates the final PDF report via `pdfService.js`.
3. Invokes `EmailService.sendEmail` to dispatch the message along with the requested custom observations and recommendations.
