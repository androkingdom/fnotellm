"use client";
import ChatWindow from "@/app/components/ChatWindow";
import ChatInput from "@/app/components/ChatInput";
import { ModeToggle } from "@/app/components/shared/theme-toggle";
import Sidebar from "@/app/components/left-col/Sidebar";

export default function HomePage() {
  return (
    <main className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">FNoteLLM</h1>
        <ModeToggle />
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <aside className="w-96 border-r border-border flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        {/* Right Chat Section */}
        <section className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Chat Window */}
          <div className="flex-1 overflow-y-auto">
            <ChatWindow />
          </div>

          {/* Fixed Input at bottom */}
          <div className="flex-none border-t border-border">
            <ChatInput />
          </div>
        </section>
      </div>
    </main>
  );
}
