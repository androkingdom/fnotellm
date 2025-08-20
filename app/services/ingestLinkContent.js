import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { normalizeDoc } from "./helpers.js";

export async function ingestLinks(links, vectorStore, userID) {
  const results = {
    processed: 0,
    failed: 0,
    totalChunks: 0,
  };

  // Process each URL (works for 1 URL or 100 URLs)
  for (const url of links) {
    console.log("URL: ", url);
    if (!url.trim()) continue;

    try {
      // Load web content
      const loader = new CheerioWebBaseLoader(url.trim());
      const docs = await loader.load();

      if (!docs || docs.length === 0) {
        console.warn(`No content from ${url}`);
        continue;
      }

      // Split into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await textSplitter.splitDocuments(docs);
      console.log("Docs LINK: ", splitDocs);

      // Add metadata
      const enrichedDocs = splitDocs.map((doc, idx) =>
        normalizeDoc(doc, url, idx, userID)
      );

      // Add to vector store
      await vectorStore.addDocuments(enrichedDocs);
      console.log(`✅ Link ${url}: ${enrichedDocs.length} chunks`);

      results.processed++;
      results.totalChunks += enrichedDocs.length;
    } catch (error) {
      console.error(`❌ Failed to process ${url}:`, error);
      results.failed++;
    }
  }

  return results;
}
