import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/firebase-config")({
  server: {
    handlers: {
      GET: async () => {
        const cfg = {
          apiKey: (process.env.GOOGLE_API_KEY || "").trim(),
          authDomain: (process.env.FIREBASE_AUTH_DOMAIN || "").trim(),
          databaseURL: (process.env.FIREBASE_DATABASE_URL || "").trim(),
          projectId: (process.env.FIREBASE_PROJECT_ID || "").trim(),
          storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || "").trim(),
          messagingSenderId: (process.env.FIREBASE_MESSAGING_SENDER_ID || "").trim(),
          appId: (process.env.FIREBASE_APP_ID || "").trim(),
          adminEmail: (process.env.ADMIN_EMAIL || "").trim(),
        };

        return new Response(JSON.stringify(cfg), {
          headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
        });
      },
    },
  },
});
