import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// Helper to validate sessions server-side
const validateSession = async (token: string, isUser: boolean) => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const hasApiV1 = backendUrl.includes('/api/v1');
  let endpoint: string;
  if (isUser) {
    endpoint = hasApiV1 ? '/auth/session' : '/api/v1/auth/session';
  } else {
    endpoint = hasApiV1 ? '/admin/auth/validate' : '/api/v1/admin/auth/validate';
  }

  const response = await fetch(`${backendUrl}${endpoint}`, {
    method: isUser ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Invalid session");
  return await response.json();
};

export const ourFileRouter = {
  // 1. Admin-only Uploader
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const cookieHeader = req.headers.get("cookie") || "";
      const token = cookieHeader.split("; ").find(row => row.startsWith("admin_token="))?.split("=")[1];

      if (!token) throw new Error("Unauthorized: Admin session required");
      
      const adminSession = await validateSession(token, false);
      return { id: adminSession.admin.id, role: 'admin' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.role, url: file.ufsUrl || file.url };
    }),

  // 2. User-only KYC Uploader
  kycUploader: f({ image: { maxFileSize: "8MB" } })
    .middleware(async ({ req }) => {
      const cookieHeader = req.headers.get("cookie") || "";
      const token = cookieHeader.split("; ").find(row => row.startsWith("access_token="))?.split("=")[1];

      if (!token) throw new Error("Unauthorized: User session required");

      const userSession = await validateSession(token, true);
      return { id: userSession.user_id, role: 'user' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.role, url: file.ufsUrl || file.url, userId: metadata.id };
    }),

  // 3. User Proof of Payment Uploader
  proofUploader: f({ image: { maxFileSize: "8MB" } })
    .middleware(async ({ req }) => {
      const cookieHeader = req.headers.get("cookie") || "";
      const token = cookieHeader.split("; ").find(row => row.startsWith("access_token="))?.split("=")[1];

      if (!token) throw new Error("Unauthorized: User session required");

      const userSession = await validateSession(token, true);
      return { id: userSession.user_id, role: 'user' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.role, url: file.ufsUrl || file.url, userId: metadata.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
