"use client";
import { useRef } from "react";

export default function FileUploadButton({ label, accept, onFileSelect }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    if (e.target.files.length > 0) {
      onFileSelect?.(e.target.files[0]);
    }
  };

  return (
    <>
      <input
        type="file"
        accept={accept}
        ref={inputRef}
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current.click()}
        className="w-full py-2 rounded-xl border bg-background hover:bg-accent transition"
      >
        {label}
      </button>
    </>
  );
}
