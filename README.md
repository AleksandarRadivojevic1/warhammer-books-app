# Librarium40k

**Live site:** [librarium40k.com](https://librarium40k.com)

A Warhammer-themed books and lore browsing app built as a full-stack portfolio project. Browse over 300 books, series, authors, and primarchs from across the Warhammer universe. Authenticated users can maintain a favorites list and a reading list with status tracking. An admin panel allows curating the featured books shown on the homepage, with drag-and-drop reordering.

## Data

All Warhammer content is served from a custom-built read-only JSON API -[warhammer-books-api](https://github.com/AleksandarRadivojevic1/warhammer-books-api), which I built and deployed separately. The backend proxies all content requests to it, keeping the external API hidden from the client and allowing rate limiting and caching at the proxy layer.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, TanStack Query
- **Backend:** Node.js, Express, MongoDB Atlas
- **Auth:** JWT access tokens + httpOnly refresh token cookies, CSRF double-submit pattern
- **Deployed:** Vercel (frontend) + Railway (backend) + Render (data API)
