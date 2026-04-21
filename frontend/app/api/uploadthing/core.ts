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

        return { token };
      } catch (err: any) {
        console.error("UPLOADTHING_MIDDLEWARE_ERROR:", err.message);
        throw err;
      }
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { token: string }; file: { appUrl?: string; url?: string; ufsUrl?: string } }) => {
      console.log("Upload complete for token:", metadata.token);
      const fileUrl = file.ufsUrl || file.url;
      console.log("file url", fileUrl);
      return { uploadedBy: "admin", url: fileUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
