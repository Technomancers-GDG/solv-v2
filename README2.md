# Solv Supply Chain — Project Setup Guide

> This guide is for anyone cloning or picking up this project. It covers **everything** you need to get the backend, frontend, and Firebase auth running locally.

---

## What This Project Is

A **disruption-aware essential-goods logistics simulator** for India.
- **Backend:** FastAPI + SQLAlchemy (SQLite by default)
- **Frontend:** Vite + React + Leaflet maps
- **Auth:** Firebase Authentication (email/password or Google sign-in)
- **Data:** News and weather events are read from local Excel files (no Google Sheets required by default)

---

## 1. Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Python | 3.10+ | FastAPI backend |
| Node.js | 18+ | Vite React frontend |
| npm | 9+ | Installs frontend packages |
| Git | any | Cloning the repo |

**Verify:**
```bash
python --version   # should be 3.10 or higher
node --version     # should be v18 or higher
npm --version
```

---

## 2. Firebase Project Setup (Required for Auth)

If someone has already shared the Firebase project with you, skip to **Step 3**.

### 2a. Create a Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `lohin-8fddc` (or whatever matches your `.env`)
3. Enable **Google Analytics** if you want (optional)

### 2b. Register a Web App
1. In your Firebase project, click the **⚙️ gear icon** → **Project settings**
2. Under **Your apps**, click **Add app** → **Web (</>)**
3. Give it a nickname (e.g., `solv-admin-portal`)
4. Copy the `firebaseConfig` values — these go into your **frontend `.env.local`**

### 2c. Enable Authentication
1. In the left sidebar, click **Build** → **Authentication**
2. Click **Get started**
3. Enable the sign-in methods you want:
   - **Email/Password** → Enable
   - **Google** → Enable → select your Support email
4. Click **Save**

### 2d. Get the Admin SDK Service Account (for the Backend)
1. In Firebase Console, click **⚙️ Project settings**
2. Go to the **Service accounts** tab
3. Click **Generate new private key**
4. Save the downloaded `.json` file somewhere safe (e.g., `C:\Users\<your-name>\Downloads\`)
5. **Copy the full path** to this file — it goes into your **backend `.env`** as `FIREBASE_CREDENTIALS_PATH`

---

## 3. Clone / Open the Project

```bash
cd d:\prjct\supply_chain\solv-v2
```

Or wherever you placed the project folder.

---

## 4. Backend Setup

### 4a. Create a Python Virtual Environment

```bash
python -m venv .venv
```

**Activate it:**
- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (CMD):**
  ```cmd
  .venv\Scripts\activate.bat
  ```
- **macOS / Linux:**
  ```bash
  source .venv/bin/activate
  ```

### 4b. Install Dependencies

```bash
pip install -r requirements.txt
```

> This installs FastAPI, SQLAlchemy, Firebase Admin SDK, pandas, scikit-learn, and everything else.

### 4c. Configure Backend Environment Variables

The repo already contains a `.env.example`. **Copy it to `.env` and edit:**

```bash
cp .env.example .env        # macOS/Linux
copy .env.example .env      # Windows CMD
```

**Key variables to check / update:**

| Variable | What to put | Example |
|----------|-------------|---------|
| `FIREBASE_ENABLED` | `true` to turn on Firebase auth | `true` |
| `FIREBASE_API_KEY` | Web API key from Firebase Console → Settings | `...` |
| `FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain | `loCCn.firebaseapp.com` |
| `FIREBASE_CREDENTIALS_PATH` | **Full path** to the downloaded admin SDK `.json` | `.\lohin-8fddc-firebase-adminsdk-....json` |
| `NEWS_DATASET_PATH` | Local Excel file for news | `All_Cities_News_v2.xlsx` |
| `WEATHER_DATASET_PATH` | Local Excel file for weather | `Historical_Weather_Data_2024_2026.xlsx` |

> **Note:** Leave `GOOGLE_SHEETS_CREDENTIALS_PATH`, `NEWS_SHEET_ID`, and `WEATHER_SHEET_ID` **empty** to use the local Excel files instead of Google Sheets.

### 4d. Run the Backend

```bash
python -m uvicorn main:app --reload
```

**Backend is live at:**
- API health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Swagger docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- WebSocket ops stream: `ws://127.0.0.1:8000/ws/operations`

Keep this terminal running.

---

## 5. Frontend Setup

Open a **second terminal** (the first one is still running the backend).

### 5a. Navigate to the Frontend Folder

```bash
cd frontend
```

### 5b. Install Node Packages

```bash
npm install
```

### 5c. Configure Frontend Environment Variables

The repo already contains `frontend/.env.example`. **Copy it to `.env.local` and edit:**

```bash
cp .env.example .env.local        # macOS/Linux
copy .env.example .env.local      # Windows CMD
```

**Key variables to check / update:**

| Variable | What to put | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Same as backend `FIREBASE_API_KEY` | `AIzaSyA6h9e...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as backend `FIREBASE_AUTH_DOMAIN` | `lohin-8fddc.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `lohin-8fddc` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `lohin-8fddc.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID from Firebase Console | `878789792698` |
| `VITE_FIREBASE_APP_ID` | App ID from Firebase Console | `1:878789792698:web:11cb58a22a6bfbd197c383` |
| `VITE_API_BASE_URL` | Where your FastAPI backend runs | `http://localhost:8000` |
| `VITE_WS_BASE_URL` | WebSocket URL | `ws://localhost:8000` |

### 5d. Run the Frontend Development Server

```bash
npm run dev
```

**Frontend is live at:**
- Vite app: [http://localhost:5173](http://localhost:5173)

The Vite dev server automatically proxies `/api` and `/ws` calls to the backend at `http://127.0.0.1:8000`.

---

## 6. How to Use the App

1. Open [http://localhost:5173](http://localhost:5173)
2. You should see a **Login** screen (powered by Firebase)
3. Create an account with **Email/Password** or sign in with **Google**
4. Once authenticated, the full dashboard loads with these tabs:
   - **Map View** — live route visualization on Leaflet
   - **Network** — warehouses, ports, links
   - **Objectives** — delivery targets
   - **Live Ops** — real-time simulation + driver decisions
   - **Scenarios** — trigger disruptions and compare AI vs baseline
   - **Driver Mobile** — simulate a driver accepting/ignoring instructions
   - **Events** — news and weather event feed
   - **Impact** — SDG-style metrics (stockouts prevented, etc.)

---

## 7. Build for Production (Optional)

To bundle the frontend so FastAPI can serve it directly:

```bash
cd frontend
npm run build
cd ..
python -m uvicorn main:app --reload
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000) — FastAPI will serve the built frontend from `frontend/dist/`.

---

## 8. Troubleshooting

### "Firebase credentials not found" error
- Double-check `FIREBASE_CREDENTIALS_PATH` in your backend `.env`
- Make sure the path uses **forward slashes** or escaped backslashes: `C:/Users/.../file.json`
- Verify the `.json` file actually exists at that path

### "Invalid or expired Firebase token" on API calls
- Your frontend token expired. **Refresh the page** or **log out and log back in**.
- Make sure `VITE_FIREBASE_API_KEY` matches the one in Firebase Console.

### "Module not found" when running backend
- Did you activate the virtual environment? Run `.\.venv\Scripts\Activate.ps1` (Windows) or `source .venv/bin/activate` (macOS/Linux)
- Did you run `pip install -r requirements.txt`?

### Frontend shows a blank screen after login
- Check the browser console (F12 → Console) for Firebase errors
- Verify all 6 `VITE_FIREBASE_*` variables are set in `frontend/.env.local`
- Make sure the backend is running on the port specified in `VITE_API_BASE_URL`

### News / Weather data not importing
- Confirm the Excel files exist in the project root:
  - `All_Cities_News_v2.xlsx`
  - `Historical_Weather_Data_2024_2026.xlsx`
- Ensure `NEWS_DATASET_PATH` and `WEATHER_DATASET_PATH` in `.env` point to the correct filenames
- If you want to use Google Sheets instead, fill in `GOOGLE_SHEETS_CREDENTIALS_PATH`, `NEWS_SHEET_ID`, and `WEATHER_SHEET_ID`

### Port already in use
- Backend: `python -m uvicorn main:app --reload --port 8001`
- Frontend: In `frontend/package.json` or `vite.config.js`, change the dev server port

---

## 9. Project Structure (Quick Reference)

```
solv-v2/
├── .env                          ← Backend env vars (create from .env.example)
├── .env.example                  ← Template for backend env vars
├── config.py                     ← Settings loader (reads .env)
├── main.py                       ← FastAPI app + all API routes
├── database.py                   ← SQLAlchemy DB setup
├── models.py                     ← DB table models
├── schemas.py                    ← Pydantic request/response schemas
├── seed_data.py                  ← Demo data (86 facilities, 6 drivers, etc.)
├── requirements.txt              ← Python dependencies
│
├── services/
│   ├── event_ingestion.py        ← Reads news/weather from Excel (or Sheets)
│   ├── firebase_auth.py          ← Firebase Admin SDK token verification
│   ├── simulation.py             ← Core simulation + decision engine
│   ├── route_planner.py          ← OSRM routing + fallback
│   └── workbook_reader.py        ← Parses .xlsx files directly
│
├── frontend/
│   ├── .env.local                ← Frontend env vars (create from .env.example)
│   ├── .env.example              ← Template for frontend env vars
│   ├── package.json              ← Node dependencies
│   ├── vite.config.js            ← Vite proxy config
│   └── src/
│       ├── firebase/config.js    ← Firebase web SDK init (reads .env.local)
│       ├── context/AuthContext.jsx  ← Login state + token management
│       ├── components/
│       │   └── LoginView.jsx     ← Firebase login UI
│       └── App.jsx               ← Main dashboard shell
│
├── All_Cities_News_v2.xlsx       ← News dataset (local Excel)
└── Historical_Weather_Data_2024_2026.xlsx  ← Weather dataset (local Excel)
```

---

## 10. Next Steps After Setup

1. **Run the simulation** from the Live Ops tab
2. **Trigger a scenario** from the Scenarios tab
3. **Compare AI vs baseline** to see the decision engine in action
4. **Check Impact metrics** to see SDG-style results
5. **Explore the API** at `/docs` to understand all available endpoints

---

**Need help?** Check the existing guides in the repo:
- `DEMO_GUIDE.md` — Walkthrough of the simulation
- `DEPLOYMENT_GUIDE.md` — Deploying to Render / cloud
- `DRIVER_APP_SETUP.md` — Setting up the driver mobile experience
