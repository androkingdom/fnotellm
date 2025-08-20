import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { createTempFile, cleanupTempFile } from "./helpers.js";
import { normalizeDoc } from "./helpers.js";

export async function ingestPdfFile(file, vectorStore, userID) {
  let filePath;
  try {
    filePath = await createTempFile(file);
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 50,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    console.log("Docs PDF: ", splitDocs);

    const enrichedDocs = splitDocs.map((doc, idx) =>
      normalizeDoc(doc, file.name, idx, userID)
    );

    await vectorStore.addDocuments(enrichedDocs);
    console.log(`✅ PDF ${file.name}: ${enrichedDocs.length} chunks`);

    return { success: true, chunksCreated: enrichedDocs.length };
  } catch (error) {
    console.error(`❌ Failed to process PDF ${file.name}:`, error);
    return { success: false, error: error.message };
  } finally {
    if (filePath) await cleanupTempFile(filePath);
  }
}

export async function ingestCsvFile(file, vectorStore, userID) {
  let filePath;
  try {
    filePath = await createTempFile(file);
    const loader = new CSVLoader(filePath);
    const docs = await loader.load();

    console.log("Docs CSV: ", docs);

    const enrichedDocs = docs.map((doc, idx) =>
      normalizeDoc(doc, file.name, idx, userID)
    );

    await vectorStore.addDocuments(enrichedDocs);
    console.log(`✅ CSV ${file.name}: ${enrichedDocs.length} rows`);

    return { success: true, chunksCreated: enrichedDocs.length };
  } catch (error) {
    console.error(`❌ Failed to process CSV ${file.name}:`, error);
    return { success: false, error: error.message };
  } finally {
    if (filePath) await cleanupTempFile(filePath);
  }
}

export async function ingestFiles(pdfFiles, csvFiles, vectorStore, userID) {
  const results = {
    pdfs: { processed: 0, failed: 0, totalChunks: 0 },
    csvs: { processed: 0, failed: 0, totalChunks: 0 },
  };

  // Process PDFs
  for (const file of pdfFiles) {
    const result = await ingestPdfFile(file, vectorStore, userID);
    if (result.success) {
      results.pdfs.processed++;
      results.pdfs.totalChunks += result.chunksCreated;
    } else {
      results.pdfs.failed++;
    }
  }

  // Process CSVs
  for (const file of csvFiles) {
    const result = await ingestCsvFile(file, vectorStore, userID);
    if (result.success) {
      results.csvs.processed++;
      results.csvs.totalChunks += result.chunksCreated;
    } else {
      results.csvs.failed++;
    }
  }

  return results;
}
