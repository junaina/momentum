"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalSheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [locked]);
}

export function ModalSheet(props: ModalSheetProps) {
  const { open, title, description, onClose, children, footer } = props;

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* overlay (non-focusable) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onPointerDown={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-(--momentum-page-max) px-(--momentum-page-padding) md:inset-0 md:flex md:items-center md:justify-center">
        <div
          className="w-full rounded-t-3xl border border-border bg-card text-card-foreground shadow-(--shadow-momentum) md:rounded-3xl"
          style={{ maxHeight: "var(--momentum-sheet-max-h)" }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex max-h-(--momentum-sheet-max-h) flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-6">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Body (scrolls) */}
            <div className="flex-1 overflow-auto px-4 py-4">{children}</div>

            {/* Footer (pinned + safe-area padding) */}
            {footer ? (
              <div className="shrink-0 border-t border-border px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
