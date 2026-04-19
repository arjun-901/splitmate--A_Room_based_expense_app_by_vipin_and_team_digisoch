import { app, ensureDBConnected } from "./_lib/app.ts";

export default async function handler(req: any, res: any) {
  try {
    await ensureDBConnected();
    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server initialization failed";
    console.error("Vercel health handler error:", error);
    return res.status(500).json({ error: message });
  }
}
