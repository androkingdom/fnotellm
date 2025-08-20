import { getVectorStore } from "@/app/services/getVectorStore";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";

export async function generateChatResponse(
  userQuery,
  conversationHistory = []
) {
  try {
    // 1. Get vector store and search for similar documents
    const vectorStore = await getVectorStore("user-uploads");
    const relevantDocs = await vectorStore.similaritySearch(userQuery, 4);

    // 2. Format retrieved context
    const context = relevantDocs
      .map((doc, index) => {
        const source =
          doc.metadata.fileName || doc.metadata.sourceUrl || "Unknown";
        return `[Document ${index + 1} - ${source}]:\n${doc.pageContent}`;
      })
      .join("\n\n");

    // 3. Create system message
    const systemMessage = `You are a helpful AI assistant. Use the following context from the user's uploaded documents to answer their questions accurately.

CONTEXT FROM DOCUMENTS:
${context || "No context available."}

Instructions:
- Answer based primarily on the provided context
- Be specific and cite which documents you're referencing  
- If information isn't in the context, clearly state that
- Keep responses conversational and helpful`;

    // 4. Initialize Google Gemini LLM
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    // 5. ✅ Format conversation history properly
    const messages = [
      new SystemMessage(systemMessage),
      // Convert conversation history to proper format
      ...conversationHistory.map((msg) =>
        msg.role === "human" || msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      new HumanMessage(userQuery),
    ];

    // 6. Call with full conversation context
    const response = await llm.invoke(messages);

    console.log("Chat response:", response.content);

    return {
      success: true,
      response: response.content,
      sources: relevantDocs.map((doc) => ({
        fileName: doc.metadata.fileName,
        fileType: doc.metadata.fileType,
        sourceUrl: doc.metadata.sourceUrl,
        content: doc.pageContent.slice(0, 200) + "...",
      })),
    };
  } catch (error) {
    console.error("Chat generation failed:", error);
    return {
      success: false,
      error: error.message,
      response: "Sorry, I encountered an error processing your request.",
    };
  }
}
