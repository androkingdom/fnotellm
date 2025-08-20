"use server";
import { generateChatResponse } from "@/app/services/chatService";

export async function POST(req) {
  try {
    const { question, history = [] } = await req.json();

    if (!question?.trim()) {
      return Response.json(
        {
          success: false,
          error: "Question is required",
        },
        { status: 400 }
      );
    }

    const result = await generateChatResponse(question, history);

    if (result.success) {
      return Response.json({
        success: true,
        answer: result.response, // Match your expected 'answer' field
        sources: result.sources,
      });
    } else {
      return Response.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
