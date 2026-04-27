import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for our app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }: { req: Request }) => {
      try {
        // Manual cookie parsing from headers (more stable in middleware)
        const cookieHeader = req.headers.get("cookie") || "";
        const token = cookieHeader
          .split("; ")
          .find(row => row.startsWith("admin_token="))
          ?.split("=")[1];

        console.log("Upload auth check. Token found:", !!token);

        if (!token) {
          throw new Error("Unauthorized: Admin session not found. Please log out and in again.");
        }

        // Validate token server-side and verify admin role
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, 5000); // 5 second timeout

          try {
            const response = await fetch(`${backendUrl}/api/v1/admin/auth/validate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
              signal: controller.signal,
            });

            // Clear timeout when response is received
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error("Unauthorized: Invalid admin token or insufficient permissions.");
            }

            const adminSession = await response.json();

            if (!adminSession.admin || adminSession.admin.status !== 'ACTIVE') {
              throw new Error("Unauthorized: Admin account is not active.");
            }

            return {
              adminId: adminSession.admin.id,
              validated: true
            };
          } catch (fetchError: any) {
            // Clear timeout if still active
            clearTimeout(timeoutId);

            // Handle abort error specifically
            if (fetchError.name === 'AbortError') {
              throw new Error("Unauthorized: Token validation timed out. Please try again.");
            }

            throw fetchError;
          }
        } catch (validationError: any) {
          console.error("Token validation failed:", validationError.message);
          throw new Error("Unauthorized: Admin session validation failed. Please log in again.");
        }

      } catch (err: any) {
        console.error("UPLOADTHING_MIDDLEWARE_ERROR:", err.message);
        throw err;
      }
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { adminId: string; validated: boolean }; file: { appUrl?: string; url?: string; ufsUrl?: string } }) => {
      // Resolve file URL with proper fallback order
      const fileUrl = file.ufsUrl || file.appUrl || file.url;

      if (!fileUrl) {
        console.error("Upload completed but no file URL available");
        throw new Error("Upload completed but no file URL available");
      }

      return { uploadedBy: "admin", url: fileUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
