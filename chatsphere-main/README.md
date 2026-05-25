# ChatSphere

ChatSphere is a production-oriented WhatsApp-style real-time chat application built with Vite + React on the frontend and Node.js + Express + MySQL + Socket.IO on the backend.

## Stack

Frontend: Vite, React, React Router DOM, Axios, Socket.IO Client, Tailwind CSS, Framer Motion, Emoji Picker, React Icons, Context API.

Backend: Node.js, Express, MySQL, Sequelize, JWT, bcryptjs, Socket.IO, Multer, Cloudinary, dotenv, cors, cookie-parser, express-validator, helmet, express-rate-limit.

## Features Included

- JWT auth with register, login, forgot password, reset password, and logout flows
- Real-time chats with online presence, typing indicators, and live message delivery
- Media uploads, voice-note recording support, and attachments
- Profile, settings, and admin dashboard screens
- Sequelize models and MySQL schema file
- Socket.IO presence and notification plumbing
- Sample seed data for quick local testing

## Folder Structure

Frontend lives in `src/`.

Backend lives in `server/src/`.

## Setup

1. Install dependencies from the repo root:

```bash
npm install
cd server
npm install
```

2. Copy the environment files:

- `/.env.example` to `/.env`
- `/server/.env.example` to `/server/.env`

3. Configure MySQL, JWT, and Cloudinary credentials.

4. Run the seed data after creating the database:

```bash
npm run seed --workspace server
```

5. Start the app:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:5000`.

## Environment Variables

Frontend:

- `VITE_API_URL`
- `VITE_SOCKET_URL`

Backend:

- `PORT`
- `CLIENT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DB`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_DEBUG`
- `SMTP_CONNECTION_TIMEOUT_MS`
- `SMTP_GREETING_TIMEOUT_MS`
- `SMTP_SOCKET_TIMEOUT_MS`
- `SMTP_SEND_TIMEOUT_MS`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Deployment

Use this verified production config as the single reference for deployment env values.

Frontend on Vercel:

- `VITE_API_URL=https://chatsphere-thpl.onrender.com/api`
- `VITE_SOCKET_URL=https://chatsphere-thpl.onrender.com`

Backend on Render:

- `CLIENT_URL=https://chatsphere-rose.vercel.app`
- `CLIENT_ORIGIN_PATTERNS=https://*.vercel.app,http://localhost:*,http://127.0.0.1:*`
- `RENDER_EXTERNAL_URL=https://chatsphere-thpl.onrender.com`

Behavior notes:

- `frontend/src/config/runtime.js` reads only `VITE_API_URL` and `VITE_SOCKET_URL`.
- `frontend/src/services/api.js` uses `VITE_API_URL` and appends `/api` only when needed.
- `frontend/src/services/socket.js` uses `VITE_SOCKET_URL` for the Socket.IO client.
- `backend/config/origins.js` shares the same origin rules for Express CORS and Socket.IO CORS.
- Localhost remains allowed only through the shared origin helper and the local Vite env files.

The rest of the backend deployment requirements remain the same:

- Deploy the frontend build to Vercel.
- Deploy the backend to Render.
- Provide MySQL hosting credentials.
- Set Cloudinary credentials.
- Set SMTP credentials for your transactional mail provider.
- For Gmail SMTP on Render, test `smtp.gmail.com:465` with `SMTP_SECURE=true` and `smtp.gmail.com:587` with `SMTP_SECURE=false`.

## Notes

- The backend uses `sequelize.sync({ alter: true })` for convenience during development. For strict production use, swap this for migrations.
- If Cloudinary credentials are missing, uploads fall back to base64 data URLs for local development.
- The voice/video call UI and signaling structure are present, and the socket event flow is in place for adding a WebRTC layer.
