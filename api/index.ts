import { app, ensureDBConnected } from "../server";

export default async function handler(req: any, res: any) {
  await ensureDBConnected();
  return app(req, res);
}
