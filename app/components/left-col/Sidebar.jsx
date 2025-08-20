"use client";

import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Config
const LIMITS = {
  pdfMaxMB: 25,
  csvMaxMB: 10,
  textMaxChars: 20000,
};

export default function Sidebar() {
  const [chips, setChips] = useState([]);
  const [linkValue, setLinkValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [errors, setErrors] = useState({ link: "", text: "", files: "" });
  const [isLoadingButton, setIsLoadingButton] = useState(false);

  // Derived submit state
  const canSubmit = useMemo(() => {
    const hasItems = chips.length > 0;
    const hasErrors = Boolean(errors.link || errors.text || errors.files);
    return hasItems && !hasErrors;
  }, [chips.length, errors]);

  function addChip(chip) {
    setChips((prev) => [chip, ...prev]);
  }

  function removeChip(id) {
    setChips((prev) => prev.filter((c) => c.id !== id));
  }

  // File picking with validation
  function pickFiles(accept, handler) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      handler(files);
    };
    input.click();
  }

  function validatePdf(files) {
    const maxBytes = LIMITS.pdfMaxMB * 1024 * 1024;
    for (const f of files) {
      const extOk = /\.pdf$/i.test(f.name) || f.type === "application/pdf";
      if (!extOk) return "Only .pdf files are allowed.";
      if (f.size > maxBytes) return `PDF must be <= ${LIMITS.pdfMaxMB}MB`;
    }
    return "";
  }

  function validateCsv(files) {
    const maxBytes = LIMITS.csvMaxMB * 1024 * 1024; // e.g., set LIMITS.csvMaxMB = 25
    for (const f of files) {
      // Accept common CSV MIME types plus .csv extension
      const isCsvMime =
        f.type === "text/csv" ||
        f.type === "application/csv" ||
        f.type === "application/vnd.ms-excel"; // some browsers use this for CSV
      const isCsvExt = /\.csv$/i.test(f.name);

      if (!(isCsvMime || isCsvExt)) return "Only .csv files are allowed.";
      if (f.size > maxBytes) return `CSV must be <= ${LIMITS.csvMaxMB}MB`;
    }
    return "";
  }

  function validateLink(value) {
    if (!value) return "Link is required.";
    try {
      const u = new URL(value);
      if (u.protocol !== "https:") return "Only https links are allowed.";
      // optional dedupe
      const exists = chips.some(
        (c) => c.kind === "link" && c.meta === u.toString()
      );
      if (exists) return "This link is already added.";
      return "";
    } catch {
      return "Enter a valid URL.";
    }
  }

  function validateText(value) {
    const t = (value || "").trim();
    if (!t) return "Text cannot be empty.";
    if (t.length > LIMITS.textMaxChars)
      return `Text must be <= ${LIMITS.textMaxChars} characters.`;
    return "";
  }

  // Actions
  function addPdf() {
    pickFiles(".pdf,application/pdf", (files) => {
      const err = validatePdf(files);
      setErrors((e) => ({ ...e, files: err }));
      if (err) return;
      for (const f of files) {
        addChip({
          id: crypto.randomUUID(),
          kind: "pdf",
          label: f.name,
          meta: `${(f.size / 1024 / 1024).toFixed(1)}MB`,
          file: f,
        });
      }
    });
  }

  function addCsv() {
    pickFiles(
      ".csv,text/csv,application/csv,application/vnd.ms-excel",
      (files) => {
        const err = validateCsv(files); // uses your CSV validator
        setErrors((e) => ({ ...e, files: err }));
        if (err) return;

        for (const f of files) {
          addChip({
            id: crypto.randomUUID(),
            kind: "csv",
            label: f.name,
            meta: `${(f.size / 1024 / 1024).toFixed(1)}MB`,
            file: f,
          });
        }
      }
    );
  }

  function addLink() {
    const err = validateLink(linkValue);
    setErrors((e) => ({ ...e, link: err }));
    if (err) return;
    const u = new URL(linkValue);
    addChip({
      id: crypto.randomUUID(),
      kind: "link",
      label: u.hostname,
      meta: u.toString(),
    });
    setLinkValue("");
  }

  function addText() {
    const err = validateText(textValue);
    setErrors((e) => ({ ...e, text: err }));
    if (err) return;
    const t = textValue.trim();
    addChip({
      id: crypto.randomUUID(),
      kind: "text",
      label: `${t.slice(0, 24)}…`,
      meta: `${t.length} chars`,
      text: t,
    });
    setTextValue("");
  }

  // Submit handler: build FormData and delegate upward or call your server action here

  async function handleSubmit() {
    if (!chips.length) {
      toast.error("Please add some content to upload!");
      return;
    }

    // Create FormData
    const fd = new FormData();
    chips.forEach((c) => {
      if (c.kind === "pdf") fd.append("pdfFiles", c.file, c.file.name);
      if (c.kind === "csv") fd.append("csvFiles", c.file, c.file.name);
      if (c.kind === "text") fd.append("texts", c.content);
      if (c.kind === "link") fd.append("links", c.url);
    });

    setIsLoadingButton(true);

    // Show loading toast
    const loadingToastId = toast.loading("Processing your documents...", {
      description: "This may take a few moments",
    });

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        body: fd,
      });

      // Parse the response
      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      // ✅ Access nested data object
      if (response.ok && result.data && result.data.success) {
        const { summary } = result.data; // ✅ Get summary from nested data

        // 🎉 Success toast
        toast.success("🎉 Documents processed successfully!", {
          description: `${summary.totalChunks} chunks created and embedded`, // ✅ Fixed template literal
          duration: 4000,
          action: {
            label: "View Details",
            onClick: () => {
              // Show detailed breakdown
              toast.info("Processing Summary", {
                description: `
📄 PDFs: ${summary.pdfs.processed} files (${summary.pdfs.totalChunks} chunks)
📊 CSVs: ${summary.csvs.processed} files (${summary.csvs.totalChunks} chunks)  
📝 Texts: ${summary.texts.processed} items (${summary.texts.totalChunks} chunks)
🔗 Links: ${summary.links.processed} URLs (${summary.links.totalChunks} chunks)
              `, // ✅ Fixed template literal
                duration: 8000,
              });
            },
          },
        });

        // Show warnings for failures
        const totalFailed =
          summary.pdfs.failed +
          summary.csvs.failed +
          summary.texts.failed +
          summary.links.failed;
        if (totalFailed > 0) {
          toast.warning(`⚠️ ${totalFailed} items failed to process`, {
            // ✅ Fixed template literal
            description: "Check console for details",
            duration: 5000,
          });
        }
      } else {
        // Error response - check both result.message and result.data.message
        const errorMessage =
          result.message || result.data?.message || "Please try again";
        toast.error("❌ Processing failed", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      console.error(error);
      toast.error("❌ Upload failed", {
        description: "Network error. Please check your connection.",
        duration: 5000,
      });
    } finally {
      setChips([]);
      setIsLoadingButton(false);
    }
  }

  return (
    <aside
      className="w-full max-w-[320px] sm:max-w-sm md:max-w-md lg:max-w-md
                      border-r border-border/70 bg-background/40 backdrop-blur-[1px]
                      p-4 sm:p-5 md:p-6 lg:p-6 flex flex-col gap-4 sm:gap-5 md:gap-6 lg:gap-6"
    >
      {/* File pickers */}
      <div className="flex flex-col gap-3 sm:gap-3 md:gap-4 lg:gap-4">
        <Button
          variant="secondary"
          type="button"
          onClick={() => addPdf(setErrors, setChips)}
          className="w-full justify-start rounded-xl border border-input
               h-10 sm:h-10 md:h-11 lg:h-11
               px-3 sm:px-3 md:px-4 lg:px-4
               text-sm sm:text-sm md:text-base lg:text-base"
        >
          PDF
        </Button>

        <Button
          variant="secondary"
          type="button"
          onClick={() => addCsv(setErrors, setChips)}
          className="w-full justify-start rounded-xl border border-input
               h-10 sm:h-10 md:h-11 lg:h-11
               px-3 sm:px-3 md:px-4 lg:px-4
               text-sm sm:text-sm md:text-base lg:text-base"
        >
          CSV
        </Button>

        {errors.files && (
          <p className="text-[11px] sm:text-xs md:text-sm lg:text-sm text-red-600">
            {errors.files}
          </p>
        )}
      </div>

      <Separator className="bg-border/60" />

      {/* Link */}
      <div className="w-full">
        <label
          htmlFor="link"
          className="mb-1 block text-xs sm:text-sm md:text-sm lg:text-sm text-muted-foreground"
        >
          Link
        </label>
        <div className="flex items-stretch gap-2 sm:gap-3 md:gap-3 lg:gap-3">
          <Input
            id="link"
            type="url"
            placeholder="https://example.com"
            value={linkValue}
            onChange={(e) => {
              setLinkValue(e.target.value);
              if (errors.link) setErrors((x) => ({ ...x, link: "" }));
            }}
            onBlur={() => {
              if (!linkValue) return;
              const msg = validateLink(linkValue);
              setErrors((e) => ({ ...e, link: msg }));
            }}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addLink())
            }
            className="flex-1 rounded-xl
                       h-10 sm:h-10 md:h-11 lg:h-11
                       text-sm sm:text-sm md:text-base lg:text-base"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addLink}
            className="rounded-xl
                       h-10 sm:h-10 md:h-11 lg:h-11
                       px-3 sm:px-3 md:px-4 lg:px-4
                       text-xs sm:text-sm md:text-sm lg:text-sm"
          >
            Add
          </Button>
        </div>
        {errors.link && (
          <p className="mt-1 text-[11px] sm:text-xs md:text-sm lg:text-sm text-red-600">
            {errors.link}
          </p>
        )}
      </div>

      {/* Text */}
      <div className="w-full">
        <label
          htmlFor="paste-text"
          className="mb-1 block text-xs sm:text-sm md:text-sm lg:text-sm text-muted-foreground"
        >
          Text
        </label>
        <Textarea
          id="paste-text"
          placeholder="Paste text content…"
          value={textValue}
          onChange={(e) => {
            const v = e.target.value.slice(0, LIMITS.textMaxChars);
            setTextValue(v);
            if (errors.text) setErrors((x) => ({ ...x, text: "" }));
          }}
          onBlur={() => {
            if (!textValue) return;
            const msg = validateText(textValue);
            setErrors((e) => ({ ...e, text: msg }));
          }}
          className="rounded-xl resize-none
                     min-h-24 sm:min-h-28 md:min-h-32 lg:min-h-36
                     p-3 sm:p-3 md:p-4 lg:p-4
                     text-sm sm:text-sm md:text-base lg:text-base
                    "
        />
        <div
          className="mt-2 flex items-center justify-between
                        text-[11px] sm:text-xs md:text-xs lg:text-sm"
        >
          <span>
            {textValue.length}/{LIMITS.textMaxChars}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={addText}
            className="rounded-xl
                       h-8 sm:h-8 md:h-9 lg:h-9
                       px-3 sm:px-3 md:px-4 lg:px-4
                       text-xs sm:text-xs md:text-sm lg:text-sm"
          >
            Add Text
          </Button>
        </div>
        {errors.text && (
          <p className="mt-1 text-[11px] sm:text-xs md:text-sm lg:text-sm text-red-600">
            {errors.text}
          </p>
        )}
      </div>

      <Separator className="bg-border/60" />

      {/* Chips */}
      <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3 lg:gap-3">
        {chips.map((c) => (
          <Badge
            key={c.id}
            variant="secondary"
            className="rounded-full px-2.5 sm:px-3 md:px-3 lg:px-3 py-1
                       text-[11px] sm:text-xs md:text-xs lg:text-xs
                       flex items-center gap-1"
            title={c.meta}
          >
            <span className="uppercase">{c.kind}</span>:{" "}
            <span className="truncate max-w-[140px]">{c.label}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeChip(c.id)}
              className="ml-1 h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-5 lg:w-5 rounded-full hover:bg-foreground/10"
              aria-label={`Remove ${c.label}`}
            >
              ×
            </Button>
          </Badge>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-auto">
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full rounded-xl
                     h-10 sm:h-10 md:h-11 lg:h-11
                     text-sm sm:text-sm md:text-base lg:text-base"
        >
          {isLoadingButton ? (
            <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 
                     animate-spin text-primary"
              />
            </div>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </aside>
  );
}
