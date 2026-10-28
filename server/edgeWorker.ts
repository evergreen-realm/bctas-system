import { handleBcatsEdgeRequest } from "../shared/bcatsEdgeHandler";

export default {
  async fetch(request: Request, env: any, _ctx: any): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/bcats")) {
      return handleBcatsEdgeRequest(request, env);
    }
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }
    return fetch(request);
  },
};
