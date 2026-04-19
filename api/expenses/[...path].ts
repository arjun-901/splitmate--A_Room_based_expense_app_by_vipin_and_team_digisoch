import { app, ensureDBConnected } from "../../server.ts";

export default async function handler(req: any, res: any) {
  try {
    await ensureDBConnected();
    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server initialization failed";
    console.error("Vercel expenses handler error:", error);
    return res.status(500).json({ error: message });
  }
}
