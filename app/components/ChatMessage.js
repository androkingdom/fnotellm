// app/components/ChatMessage.js
"use client";

import clsx from "clsx";

export function ChatMessage({ role, text }) {
  const isUser = role === "user";

  return (
    <div
      className={clsx(
        "flex w-full mb-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={clsx(
          "max-w-[75%] px-4 py-2 rounded-2xl text-sm sm:text-base md:text-lg",
          isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-gray-900 rounded-bl-none"
        )}
      >
        {text}
      </div>
    </div>
  );
}
