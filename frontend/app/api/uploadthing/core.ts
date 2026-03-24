import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAdminToken } from "@/lib/adminApi";

const f = createUploadthing();

// FileRouter for our app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }: { req: Request }) => {
      const token = getAdminToken();
      if (!token) throw new Error("Unauthorized");
      return { token };
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { token: string }; file: { url: string } }) => {
      console.log("Upload complete for token:", metadata.token);
      console.log("file url", file.url);
      return { uploadedBy: metadata.token, url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
