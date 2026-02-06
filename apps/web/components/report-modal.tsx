"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";

const REPORT_REASON_KEYS = [
  "spam",
  "harassment",
  "misinformation",
  "violence",
  "hate_speech",
  "other",
] as const;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "POST" | "REPLY" | "USER" | "DM";
}

export function ReportModal({
  isOpen,
  onClose,
  targetId,
  targetType,
}: ReportModalProps) {
  const tCommon = useTranslations("common");
  const { success: toastSuccess, error: toastError } = useToast();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setComment("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setLoading(true);

    try {
      const res = await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId,
          targetType,
          reason: selectedReason,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        toastSuccess("Report submitted");
        onClose();
      } else {
        throw new Error();
      }
    } catch {
      toastError("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#1e1f21] rounded-2xl border border-white/10 shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 21v-8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h2 className="text-xl font-bold text-paper">Report Content</h2>
        </div>

        <p className="text-secondary text-sm mb-4 shrink-0">
          Please select a reason for reporting this content.
        </p>

        <div className="space-y-2 overflow-y-auto mb-4 px-1">
          {REPORT_REASON_KEYS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${
                selectedReason === reason
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-black/20 border-white/5 text-paper hover:bg-white/5"
              }`}
            >
              <span className="capitalize">{reason.replace("_", " ")}</span>
              {selectedReason === reason && (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="shrink-0">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Additional details (optional)..."
            rows={3}
            maxLength={500}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-paper placeholder-secondary focus:outline-none focus:border-primary transition-colors resize-none mb-4"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-paper transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || loading}
              className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
            >
              {loading ? "Reporting..." : "Report"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
