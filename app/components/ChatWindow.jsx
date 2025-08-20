import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import ChatMessage from "./ChatMessage";

export default function ChatWindow() {
  const { messages } = useSelector((state) => state.chat);
  const scrollRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0"
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="text-6xl mb-4">🤖</div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Chat with Your Documents
            </h3>
            <p className="text-muted-foreground max-w-md">
              Ask me anything about your uploaded PDFs, CSVs, texts, and web
              content. I'll search through your documents to provide relevant
              answers.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Powered by Google Gemini
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
