"use client";
import { useState } from "react";

export default function LinkModal({ open, onClose, onSubmit }) {
  const [link, setLink] = useState("");

  if (!open) return null;

  const handleSave = () => {
    if (!link) return;
    onSubmit?.(link);
    setLink("");
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-background p-6 rounded-xl shadow-xl w-80">
        <h2 className="text-lg font-semibold mb-3">Enter a Link</h2>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 rounded-md border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md border hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
