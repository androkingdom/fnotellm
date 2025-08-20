import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createMetadata } from "./helpers.js";

export async function ingestTextContent(
  textContent,
  vectorStore,
  source = "pasted-text"
) {
  if (!textContent.trim()) {
    return { success: true, chunksCreated: 0 };
  }

  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments(
      [textContent],
      [createMetadata(source, "text")]
    );

    await vectorStore.addDocuments(docs);
    console.log(`✅ Text content: ${docs.length} chunks`);

    return { success: true, chunksCreated: docs.length };
  } catch (error) {
    console.error(`❌ Failed to process text content:`, error);
    return { success: false, error: error.message };
  }
}

export async function ingestTexts(texts, vectorStore) {
  const results = {
    processed: 0,
    failed: 0,
    totalChunks: 0,
  };

  for (const [index, textContent] of texts.entries()) {
    const result = await ingestTextContent(
      textContent,
      vectorStore,
      `pasted-text-${index + 1}`
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
