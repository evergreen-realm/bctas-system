import { handleBcatsEdgeRequest } from "../../shared/bcatsEdgeHandler";

export async function onRequest(context: {
  request: Request;
  env: Record<string, any>;
  params: Record<string, string | string[]>;
  next: () => Promise<Response>;
}): Promise<Response> {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith("/api/bcats")) {
    return handleBcatsEdgeRequest(context.request, context.env);
  }
  return context.next();
}
