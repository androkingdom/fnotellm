"use server";
import { getVectorStore } from "@/app/services/getVectorStore";
import { ingestFiles } from "./ingestFileContent.js";
import { ingestTexts } from "./ingestTextContent.js";
import { ingestLinks } from "./ingestLinkContent.js";

export async function ingestAction(formData, userID) {
  try {
    const vectorStore = await getVectorStore("user-uploads");

    // Extract form data
    const pdfFiles = formData.getAll("pdfFiles");
    const csvFiles = formData.getAll("csvFiles");
    const texts = formData.getAll("texts");
    const links = formData.getAll("links");
    console.log("Texts: frm ingestion", texts);
    console.log("Links: frm ingestion", links);

    console.log(
      `Processing: ${pdfFiles.length} PDFs, ${csvFiles.length} CSVs, ${texts.length} texts, ${links.length} links`
    );

    // Process all content types
    const [fileResults, textResults, linkResults] = await Promise.all([
      ingestFiles(pdfFiles, csvFiles, vectorStore, userID),
      ingestTexts(texts, vectorStore, userID),
      ingestLinks(links, vectorStore, userID),
    ]);

    // Calculate totals
    const totalChunks =
      fileResults.pdfs.totalChunks +
      fileResults.csvs.totalChunks +
      textResults.totalChunks +
      linkResults.totalChunks;

    const summary = {
      pdfs: fileResults.pdfs,
      csvs: fileResults.csvs,
      texts: textResults,
      links: linkResults,
      totalChunks,
    };

    console.log("✅ Ingestion Summary:", summary);

    return {
      success: true,
      message: `Successfully processed ${totalChunks} document chunks`,
      summary,
    };
  } catch (error) {
    console.error("❌ Ingestion failed:", error);
    throw new Error(`Failed to process documents: ${error.message}`);
  }
}
