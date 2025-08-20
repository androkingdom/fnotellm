import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { normalizeDoc } from "./helpers.js";

export async function ingestTextContent(
  textContent,
  vectorStore,
  source = "pasted-text",
  userID
) {
  if (!textContent.trim()) {
    return { success: true, chunksCreated: 0 };
  }

  console.log("Text content: ", textContent);

  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 50,
    });

    const docs = (await textSplitter.splitText(textContent)).map(
      (chunk, idx) => ({
        pageContent: chunk,
        metadata: { type: "text", chunkIndex: idx },
      })
    );

    const enrichedDocs = docs.map((doc, idx) =>
      normalizeDoc(doc, source, idx, userID)
    );

    await vectorStore.addDocuments(enrichedDocs);
    console.log(`✅ Text content: ${enrichedDocs.length} chunks`);

    return { success: true, chunksCreated: enrichedDocs.length };
  } catch (error) {
    console.error(`❌ Failed to process text content:`, error);
    return { success: false, error: error.message };
  }
}

export async function ingestTexts(texts, vectorStore, userID) {
  const results = {
    processed: 0,
    failed: 0,
    totalChunks: 0,
  };

  for (const [index, textContent] of texts.entries()) {
    const result = await ingestTextContent(
      textContent,
      vectorStore,
      `pasted-text-${index + 1}`,
      userID
    );

    if (result.success) {
      results.processed++;
      results.totalChunks += result.chunksCreated;
    } else {
      results.failed++;
    }
  }

  return results;
}
