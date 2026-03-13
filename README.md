# trace.ly

**trace.ly** is an end-to-end encrypted, real-time location-sharing Progressive Web App (PWA). It is built for temporary tracking sessions, allowing users to create secure rooms and share live locations via invite links or QR codes.

The core focus of this project is privacy: location payloads are encrypted entirely on the client side before being transmitted. The server acts only as a router and never has access to the decryption keys or raw location data.

[![Hero Screenshot](public/heropage.png)](https://tracely-rt.vercel.app)

## ✨ Features

- **Real-Time Tracking & Path Trails**: Broadcasts live location coordinates and renders participant movement paths using Leaflet.
- **Client-Side E2E Encryption**: Uses AES-256-GCM for encryption and HMAC-SHA256 for integrity verification. Keys are generated via the Web Crypto API and never leave the browser.
- **Room Access Controls**: Hosts can secure rooms with 4-digit PINs, mandate manual approvals for new joins, and kick active participants.
- **Pocket Mode & Wake Lock**: A battery-conscious mode that disables map rendering while continuing to broadcast. Uses the Screen Wake Lock API to prevent the device from sleeping.
- **Background Heartbeats**: Utilizes a Web Worker to maintain Socket.IO connections even when the app is running in the background.
- **PWA Support**: Installable on mobile devices with a custom offline fallback UI when the network drops.
- **Ephemeral Sessions**: Rooms and their associated data are automatically destroyed after a configurable duration (1–12 hours).

## 🏗️ Architecture

The system uses a hybrid state management approach. An in-memory cache handles rapid operations like rate-limiting, while Redis acts as the primary source of truth for room states and cross-instance presence.

```text
Client (Next.js PWA)
      │
      │  Encrypted payloads + Worker Heartbeats
      ▼
Socket.IO Server (Node.js)
      ├── In-Memory Rate Limiter (Request buffering)
      ├── In-Memory Cache (Room lookups)
      │
      ▼
Redis (Persistent Room State + Clustering)
      │
      ▼
Broadcast encrypted payloads to room participants

```

## 🛠️ Tech Stack

**Frontend:**

- Next.js (App Router) & TypeScript
- Tailwind CSS v4
- React Leaflet for mapping
- Framer Motion for UI transitions
- Socket.IO Client

**Backend:**

- Node.js & Express
- Socket.IO with Redis Adapter
- Redis (ioredis) for scalable state management
- Helmet & Express Rate Limit

**Cryptography & APIs:**

- Web Crypto API (AES-GCM, HMAC)
- Screen Wake Lock API
- Service Workers (PWA)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/riki-k-dev/trace.ly.git
cd trace.ly

```

### 2. Install dependencies

```bash
# Install client dependencies
cd client
pnpm install

# Install server dependencies
cd ../server
pnpm install

```

### 3. Configure environment variables

Create `.env` files in both directories.

**Client (`client/.env`)**

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

```

**Server (`server/.env`)**

```env
PORT=5000
CLIENT_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379

```

### 4. Start Redis

Make sure your local Redis instance is running:

```bash
redis-server

```

### 5. Run the Application

Start the Node server:

```bash
cd server
pnpm run dev

```

Start the Next.js client:

```bash
cd client
pnpm run dev

```

Open `http://localhost:3000` to create your first secure room.

## 🔐 Security Implementation

- **Zero-Knowledge Architecture:** The AES key is generated locally, stored in `sessionStorage`, and shared with peers via the URL hash fragment (`#key`). URL hashes are not sent to the server.
- **Payload Integrity:** Every location update is signed with HMAC. If a payload is tampered with in transit, the client rejects it instantly.
- **Rate Limiting:** IP and Socket ID-based rate limits prevent client-side flooding from overwhelming the Redis instance.

## 📜 License

This project is licensed under the **MIT License**.
