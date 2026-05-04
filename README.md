# WhatsApp Clone — Premium Refactor

A modular, scalable WhatsApp Web clone built with the EMS (Entity-Module-Service) architecture.

## 🚀 Key Features
- **EMS Architecture**: Decoupled modules for Auth, Messaging, and User management.
- **Presence Tracking**: Redis-backed real-time user online/offline status.
- **Secure Auth**: OTP-based authentication with bcrypt hashing.
- **WebRTC Calling**: Real-time video/audio calling.
- **Performance**: Paginated message history for smooth scrolling.
- **Dockerized**: One-command deployment with Docker Compose.

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Socket.io-client, Axios.
- **Backend**: Node.js, Express, MongoDB, Socket.io, Redis, Bcrypt, JWT.
- **Infrastructure**: Docker, Nginx.

## 📦 Setup & Installation

### 1. Environment Variables
Create `.env` files based on the `.env.example` templates in both `backend/` and `frontend/`.

### 2. Run with Docker (Recommended)
```bash
docker-compose up --build
```

### 3. Manual Local Setup
**Backend:**
```bash
cd backend
npm install
npm run dev
```
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure
```text
├── backend/
│   ├── config/          # DB & Service connections
│   ├── middleware/      # Auth & Global middleware
│   ├── models/          # Mongoose schemas
│   ├── modules/         # EMS Business Logic
│   │   ├── auth/        # OTP & JWT logic
│   │   ├── messages/    # Chat & Pagination
│   │   └── users/       # Profile management
│   ├── socket/          # Socket.io handlers
│   └── server.js        # Slim entry point
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios & Service clients
│   │   ├── modules/     # Feature-based components
│   │   ├── shared/      # Reusable UI components
│   │   └── App.jsx      # Main orchestrator
└── docker-compose.yml
```
