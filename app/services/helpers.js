import fs from "fs/promises";
import path from "path";

export async function createTempFile(file) {
  const uploadsDir = path.join(process.cwd(), "temp-uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uniqueFileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}-${file.name}`;
  const filePath = path.join(uploadsDir, uniqueFileName);

  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to cleanup temp file: ${filePath}`, error);
  }
}

export function createMetadata(fileName, fileType, additionalMeta = {}) {
  return {
    fileName,
    fileType,
    uploadedAt: new Date().toISOString(),
    ...additionalMeta,
  };
}

export function normalizeDoc(doc, source, idx, userID) {
  return {
    pageContent: doc.pageContent || doc.text || "",
    metadata: {
      ...doc.metadata,
      ...createMetadata(source, doc.type || "text", { chunkIndex: idx }),
      userID: String(userID), // force save
    },
  };
}
