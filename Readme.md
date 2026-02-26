## Arsitektur Project

````
app/
├── _layout.tsx          → Root layout (seperti app/layout.tsx di Next.js)
├── index.tsx            → Route "/"
├── (auth)/
│   ├── _layout.tsx      → Layout khusus grup auth
│   ├── login.tsx        → Route "/login"  (tapi tanpa "(auth)" di URL)
│   └── register.tsx     → Route "/register"
├── (tabs)/
│   ├── _layout.tsx      → Definisi bottom tab navigator
│   ├── index.tsx        → Tab pertama "/"
│   ├── gallery.tsx      → Tab "/gallery"
│   └── map.tsx          → Tab "/map"
└── memory/
    ├── [id].tsx         → Route "/memory/123" (dynamic route)
    └── create.tsx       → Route "/memory/create"

```bash
````
