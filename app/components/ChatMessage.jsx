"use client";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const isLoading = message.status === "loading";
  const isError = message.status === "error";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className="max-w-[75%] space-y-1">
        {/* Main message bubble */}
        <div
          className={`
            px-4 py-2 rounded-2xl 
            text-sm sm:text-base md:text-lg 
            ${
              isUser
                ? "bg-primary text-primary-foreground rounded-br-none"
                : isError
                ? "bg-destructive/10 text-destructive rounded-bl-none"
                : "bg-muted text-muted-foreground rounded-bl-none"
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full opacity-70"></div>
              <span className="opacity-70">Thinking...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          )}
        </div>

        {/* Sources section */}
        {message.sources?.length > 0 && (
          <div className="ml-4 space-y-1">
            <div className="text-xs font-medium text-muted-foreground/80">
              📚 Sources:
            </div>
            <div className="space-y-1">
              {message.sources.map((source, i) => {
                const type = source.fileType || "unknown"; // from normalizeDoc
                let label;

                switch (type) {
                  case "pdf":
                    label = `📄 PDF: ${source.fileName || "Untitled"}`;
                    break;
                  case "csv":
                    label = `📊 CSV: ${source.fileName || "Untitled"}`;
                    break;
                  case "link":
                    label = `🔗 Link: ${source.sourceUrl || "Unknown link"}`;
                    break;
                  case "text":
                    label = "📝 Text Snippet";
                    break;
                  default:
                    label =
                      source.fileName || source.sourceUrl || "Unknown source";
                }

                return (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground/70 flex items-center bg-muted/30 px-2 py-1 rounded-lg"
                  >
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full mr-2 flex-shrink-0"></div>
                    <span className="truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && !isLoading && (
          <div
            className={`text-xs px-2 ${
              isUser ? "text-primary/60 text-right" : "text-muted-foreground/50"
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        {/* Error indicator */}
        {isError && (
          <div className="text-xs text-destructive flex items-center ml-4">
            <span className="mr-1">⚠️</span>
            Failed to send
          </div>
        )}
      </div>
    </div>
  );
}
