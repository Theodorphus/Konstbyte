import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const uploadRouter = {
  artworkImage: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      // Add auth validation here when auth is wired for uploads
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      // Persist upload metadata if needed
      return { url: file.url };
    })
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
