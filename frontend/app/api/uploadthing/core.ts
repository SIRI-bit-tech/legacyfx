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
          const response = await fetch(`${backendUrl}/api/v1/admin/auth/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error("Unauthorized: Invalid admin token or insufficient permissions.");
          }

          const adminSession = await response.json();

          if (!adminSession.admin || adminSession.admin.status !== 'ACTIVE') {
            throw new Error("Unauthorized: Admin account is not active.");
          }

          console.log("Upload auth successful for admin:", adminSession.admin.email);

          return {
            token: token,
            admin: adminSession.admin,
            validated: true
          };
        } catch (validationError: any) {
          console.error("Token validation failed:", validationError.message);
          throw new Error("Unauthorized: Admin session validation failed. Please log in again.");
        }

      } catch (err: any) {
        console.error("UPLOADTHING_MIDDLEWARE_ERROR:", err.message);
        throw err;
      }
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { token: string; admin: any; validated: boolean }; file: { appUrl?: string; url?: string; ufsUrl?: string } }) => {
      // Don't log sensitive admin credentials
      console.debug("Upload complete for admin:", metadata.admin?.email || "unknown");

      // Resolve file URL with proper fallback order
      const fileUrl = file.ufsUrl || file.appUrl || file.url;

      if (!fileUrl) {
        console.error("Upload completed but no file URL available");
        throw new Error("Upload completed but no file URL available");
      }

      console.log("File uploaded successfully");
      return { uploadedBy: "admin", url: fileUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
