import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";
 
// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
 
  // Apply additional context, like the current user, or an admin secret
  // config: { ... },
});
