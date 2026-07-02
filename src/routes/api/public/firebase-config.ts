import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/firebase-config")({
  server: {
    handlers: {
      GET: async () => {
        const cfg = {
          apiKey: process.env.GOOGLE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          databaseURL: process.env.FIREBASE_DATABASE_URL,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
          adminEmail: process.env.ADMIN_EMAIL || "",
        };
        return new Response(JSON.stringify(cfg), {
          headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
        });
      },
    },
  },
});
