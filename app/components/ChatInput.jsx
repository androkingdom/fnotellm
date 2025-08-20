"use client";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toast } from "sonner";
import {
  addMessage,
  addPendingAssistant,
  updateMessage,
  setMessageError,
  clearError,
} from "@/lib/features/chat/chatSlice";

export default function ChatInput() {
  const [value, setValue] = useState("");
  const dispatch = useAppDispatch();
  const { messages, error } = useAppSelector((state) => state.chat);

  // Check if assistant is currently thinking
  const isLoading = messages.some((m) => m.status === "loading");

  const handleSend = async () => {
    if (!value.trim() || isLoading) return;

    dispatch(clearError());

    // 1. Add user message
    const userMessageId = Date.now();
    dispatch(
      addMessage({
        id: userMessageId,
        role: "user",
        content: value.trim(),
      })
    );

    // 2. Add pending assistant message
    const assistantMessageId = Date.now() + 1;
    dispatch(
      addPendingAssistant({
        id: assistantMessageId,
      })
    );

    // 3. Get conversation history for context
    const history = messages
      .filter((msg) => msg.status === "sent")
      .slice(-6)
      .map((msg) => ({
        role: msg.role === "user" ? "human" : "assistant",
        content: msg.content,
      }));

    // 4. Call API directly here
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: value.trim(),
          history,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ✅ Update message with AI response
        dispatch(
          updateMessage({
            id: assistantMessageId,
            content: data.answer,
            sources: data.sources || [],
          })
        );
      } else {
        // ❌ Handle API error
        dispatch(setMessageError({ id: assistantMessageId }));
        toast.error(`❌ ${data.error || "Failed to get response"}`);
      }
    } catch (error) {
      // ❌ Handle network error
      dispatch(setMessageError({ id: assistantMessageId }));
      toast.error(`❌ Network error: ${error.message}`);
    }

    setValue("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-none flex items-center gap-2 p-3 border-t bg-background">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask me anything about your documents..."
        disabled={isLoading}
        className="flex-1 px-4 py-2 rounded-xl border bg-input text-foreground placeholder:text-muted-foreground 
               focus:outline-none focus:ring-2 focus:ring-ring 
               text-sm sm:text-base md:text-lg
               disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition 
               text-sm sm:text-base md:text-lg
               disabled:opacity-50 disabled:cursor-not-allowed
               min-w-[60px]"
      >
        {isLoading ? "..." : "Ask"}
      </button>

      {error && (
        <div className="absolute bottom-full left-3 mb-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
