# LKKey — Smart Lookup Data API Gateway

**LKKey** is a standalone, reusable lookup data microservice and API gateway built using **Next.js (App Router, TypeScript)**. It allows developers and administrators to upload raw Excel datasets (RTO codes, pincodes, ISD codes, IFSC codes, GST registries, etc.), parses columns automatically, and exposes high-performance public REST endpoints protected by custom API keys.

The project features a premium, Vercel/CRED-inspired dark developer dashboard styled with Vanilla CSS.

---

## 🚀 Key Features

*   **Generic Dataset Engine**: Reuse the same microservice for any tabular dataset. No code changes are required for new tables.
*   **Smart Column Detection**: Automatically detects column indices for `city` and `rto_code` on Excel uploads that do not contain header rows, by scanning data cell fingerprints.
*   **State Prefix Inference**: Automatically infers the Indian State field (e.g. `state: "Maharashtra"`) by analyzing RTO code prefixes (e.g. `MH`), making uploads even simpler.
*   **Server-Side Fuzzy Search**: Fast, typo-tolerant lookups using `fuse.js` on configured searchable fields.
*   **Token-Based Security**: Administrative endpoints are protected by an `ADMIN_SECRET` header, while public queries require client `x-api-key` headers.
*   **Rate Limiting**: Integrated in-memory sliding window rate limits (100 req/min for search/lookups, 10 req/min for full scans) per client key.
*   **CORS Ready**: Configured CORS preflight handlers and origin wildcards so any external frontend can consume the APIs directly.
*   **Data Integrity**: Auto-seeding runs strictly when no datasets exist, preventing any data loss or overwrites for previously uploaded records during restarts or redeploys.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 16 (App Router + React)
*   **Runtime**: Node.js (TypeScript)
*   **Database**: MongoDB Atlas + Mongoose
*   **Excel Engine**: SheetJS (`xlsx`)
*   **Fuzzy Matching**: `fuse.js`
*   **Icons**: `lucide-react`

---

## 📦 Local Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/AmanMahadik/LKKey.git
    cd LKKey
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory (refer to `.env.example`):
    ```env
    MONGODB_URI=your_mongodb_connection_string
    ADMIN_SECRET=your_secure_admin_secret_here
    PORT=3000
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the developer dashboard.

5.  **Build for Production**:
    ```bash
    npm run build
    npm run start
    ```

---

## ☁️ Deployment Guide

LKKey is designed to run as a single deployable serverless or containerized service.

### 1. Deploying to Vercel (Serverless)
Next.js integrates natively with Vercel:
1. Push your code to GitHub.
2. Import the repository into the **Vercel Dashboard**.
3. Add the following **Environment Variables**:
   - `MONGODB_URI`
   - `ADMIN_SECRET`
4. Click **Deploy**. Vercel will build the frontend and serve the Route Handlers under Serverless Functions automatically.

### 2. Deploying to Railway / Render (Docker/Node container)
Railway and Render automatically detect Next.js and run the server using `npm run start`:
1. Create a new service and connect your repository.
2. In the service settings, add the environment variables:
   - `MONGODB_URI`
   - `ADMIN_SECRET`
   - `PORT` (Railway/Render will bind this automatically at runtime).
3. The server will start, exposing the dashboard and API routes under a persistent host.

---

## 📡 API Reference

All requests must contain headers:
*   Admin endpoints: `x-admin-secret: <your_admin_secret>`
*   Public endpoints: `x-api-key: <client_api_key>`

### Admin Endpoints
*   `POST /api/admin/datasets` — Create a new dataset definition schema.
*   `GET /api/admin/datasets` — List dataset schemas.
*   `POST /api/admin/datasets/:slug/upload` — Upload Excel workbook (`file` parameter, multi-part form data).
*   `POST /api/admin/api-keys` — Generate a new API key.
*   `GET /api/admin/api-keys` — List generated API keys and usage statistics.
*   `PATCH /api/admin/api-keys/:id/revoke` — Revoke (deactivate) an API key.
*   `GET /api/admin/health` — Check database status and count statistics.

### Public Endpoints
*   `GET /api/v1/:datasetSlug/search?q=query` — Fuzzy search across searchable fields (e.g., typos like `q=Nasik`).
*   `GET /api/v1/:datasetSlug/lookup?city=Nashik` — Exact/filtered lookup.
*   `GET /api/v1/:datasetSlug/all?page=1&limit=20` — Retrieve paginated full dataset.
