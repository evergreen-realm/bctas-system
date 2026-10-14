import type { Express, Request, Response } from "express";
import { store, type Role, type Status } from "./bcatsStore";

const roles: Role[] = ["Clerk", "Registrar", "Administrator", "Auditor", "Citizen"];
const roleFrom = (req: Request): Role => { const value = req.header("x-bcats-role") as Role | undefined; return value && roles.includes(value) ? value : "Administrator"; };
const meta = (req: Request) => ({ role: roleFrom(req), staffName: req.header("x-bcats-staff") || "Preview operator", clientIp: req.ip || "127.0.0.1", userAgent: req.header("user-agent") || "BCATS client" });
const json = (res: Response, status: number, payload: unknown) => res.status(status).json(payload);
const handler = (fn: (req: Request, res: Response) => unknown) => (req: Request, res: Response) => { try { return fn(req, res); } catch (error) { const message = error instanceof Error ? error.message : "Request could not be completed."; return json(res, message.includes("Only") || message.includes("authorised") ? 403 : 400, { error: message }); } };

export function registerBcatsApi(app: Express) {
  app.get("/api/bcats/bootstrap", handler((_req, res) => json(res, 200, store.bootstrap())));
  app.get("/api/bcats/applications", handler((req, res) => json(res, 200, store.list(String(req.query.q || "")))));
  app.get("/api/bcats/applications/:id", handler((req, res) => { const found = store.find(req.params.id); return found ? json(res, 200, found) : json(res, 404, { error: "Application was not found in the Nakuru registry." }); }));
  app.post("/api/bcats/applications", handler((req, res) => json(res, 201, store.create(req.body, meta(req)))));
  app.post("/api/bcats/applications/:id/verify", handler((req, res) => json(res, 200, store.verify(req.params.id, { iprsMatch: Boolean(req.body.iprsMatch), hospitalMatch: Boolean(req.body.hospitalMatch), otpVerified: Boolean(req.body.otpVerified), discrepancyReason: req.body.discrepancyReason }, meta(req)))));
  app.post("/api/bcats/applications/:id/status", handler((req, res) => json(res, 200, store.transition(req.params.id, req.body.nextStatus as Status, String(req.body.justification || ""), meta(req)))));
  app.post("/api/bcats/applications/:id/print", handler((req, res) => json(res, 200, store.print(req.params.id, meta(req)))));
  app.post("/api/bcats/applications/:id/collect", handler((req, res) => json(res, 200, store.collect(req.params.id, { collectorName: String(req.body.collectorName || ""), collectorNationalId: String(req.body.collectorNationalId || "") }, meta(req)))));
  app.get("/api/bcats/audit", handler((_req, res) => json(res, 200, store.auditLog())));
  app.get("/api/bcats/reports/summary", handler((_req, res) => json(res, 200, store.reports())));
  app.get("/api/bcats/integrations", handler((_req, res) => json(res, 200, store.integrations())));
  app.post("/api/bcats/staff/:employeeId/eula", handler((req, res) => json(res, 200, store.acceptEula(req.params.employeeId))));
  app.get("/api/bcats/settings", handler((_req, res) => json(res, 200, store.bootstrap().settings)));
}
