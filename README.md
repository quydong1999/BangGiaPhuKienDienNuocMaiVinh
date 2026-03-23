<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Điện Nước Mai Vinh - Modern E-Commerce Catalog

A highly-optimized full-stack web application built with **Next.js 15**, focusing on extreme performance, mobile-first design, and seamless user experience. Designed to showcase modern frontend and backend architectures at enterprise scale.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Upstash_Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)

[**View Live Demo**](http://mai-vinh-dien-nuoc.vercel.app/) <!-- Edit link to production -->

</div>

## 🚀 Key Features & Architectural Highlights

### 1. Hybrid Rendering & Server Components
Leveraged the **Next.js App Router** with seamless transitions between **Server Components (RSC)** and **Client Components**.
- **Static Site Generation (SSG):** Used caching and static building for shells and layouts (Header, Breadcrumb).
- **Client-Side Rendering (CSR):** Used React Suspense and TanStack Query to stream dynamic data and manage internal component states interactively, ensuring minimum Time To Interactive (TTI).

### 2. High-Performance Caching Strategy
- **Upstash Redis Layer:** Implemented Redis as a fast in-memory caching layer strictly reducing latency. Complex MongoDB aggregation queries are bypassed, guaranteeing response times typically `<50ms`.
- **Intelligent Cache Invalidation:** Designed granular eviction policies clearing cache solely when related database boundaries mutate (Create/Update/Delete).

### 3. Progressive Web App (PWA) & Mobile-First UX
- Highly responsive **Mobile-First interface** maximizing real-estate utilization and finger-friendly tap targets.
- Out-of-the-box **PWA setup** allowing installation directly as a native application for both iOS and Android.
- Refined UI built iteratively using **Tailwind CSS v4** featuring modern glassmorphism, gradient styling, auto-scroll paginations, and skeleton loaders.

### 4. Authentication, Security & RBAC
- Complete Role-Based Access Control logic via an invisible abstraction layer using **NextAuth.js (Auth.js v5)**.
- Passwordless experience through **Google One-Tap Login** securing administrative dashboard features.
- Zero-trust principle adopted: Client-side buttons gracefully hide/lock their actions without valid Admin sessions while Backend APIs independently re-validate authenticated context globally.

### 5. Advanced SEO & Semantic Parsing
- **Dynamic Metadata & Open Graph Data:** Rich object routing dynamically pulling product specifics generating canonicals and previews seamlessly.
- **Microdata & JSON-LD:** Structured schema configurations ensuring pristine indexing by Google Search crawlers as a Store/Product catalog context.
- High focus on **Semantic HTML** layout (`<main>`, `<nav>`, `<aside>`, `<section>`).

## 💻 Technical Stack Depth

- **Core Framework:** Next.js 15.4 (React 19)
- **Language:** TypeScript 5
- **Styling Engine:** Tailwind CSS 4.1.11, Lucide React Icons
- **Primary Database:** MongoDB (Mongoose 9.3)
- **Fast KV Cache:** Upstash Redis
- **Auth Provider:** Next-Auth (beta v5)
- **State & Data Fetching:** TanStack React Query v5
- **Forms & Type Validation:** React Hook Form + Zod
- **Media Optimization:** Browser Image Compression algorithm, Cloudinary Serverless Storage

## ⚙️ Getting Started

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Environment Variables (`.env.local`)
To run this project, make sure to add the following sensitive variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Upstash Redis Cache
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# NextAuth Details
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_auth_secret
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret

# Cloudinary Integration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### Run Locally
Launch the fast development server:
```bash
npm run dev
```

Browse the application on [http://localhost:3000](http://localhost:3000).

---
*Designed and engineered with passion. Built to demonstrate full-stack problem-solving competence, modern web standards, and high-performance design.*
