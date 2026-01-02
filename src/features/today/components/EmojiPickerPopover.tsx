"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EmojiClickDetail = {
  unicode?: string;
  emoji?: { unicode?: string; native?: string };
};

type EmojiClickEvent = CustomEvent<EmojiClickDetail>;

type EmojiPickerPopoverProps = {
  value: string;
  onChange: (next: string) => void;
};

function useOnClickOutside(
  refs: ReadonlyArray<React.RefObject<HTMLElement | null>>,
  handler: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;

      const inside = refs.some((r) => {
        const el = r.current;
        return el ? el.contains(target) : false;
      });

      if (!inside) handler();
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [enabled, handler, refs]);
}

function extractUnicode(e: Event): string {
  const evt = e as EmojiClickEvent;

  const d = evt.detail;
  const unicode = d.unicode ?? d.emoji?.unicode ?? d.emoji?.native ?? "";

  return unicode;
}

export function EmojiPickerPopover({
  value,
  onChange,
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState<boolean>(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const pickerHostRef = useRef<HTMLDivElement | null>(null);

  useOnClickOutside([buttonRef, popoverRef], () => setOpen(false), open);

  // Mount the web component only when popover opens
  useEffect(() => {
    if (!open) return;

    let disposed = false;
    let pickerEl: HTMLElement | null = null;

    const mount = async () => {
      await import("emoji-picker-element"); // registers <emoji-picker>

      if (disposed) return;
      const host = pickerHostRef.current;
      if (!host) return;

      host.innerHTML = "";

      pickerEl = document.createElement("emoji-picker");
      // Some light sizing hints; web component handles its own UI
      (pickerEl as HTMLElement).style.width = "100%";

      const onEmojiClick = (ev: Event) => {
        const unicode = extractUnicode(ev);
        if (unicode.length > 0) {
          onChange(unicode);
          setOpen(false);
        }
      };

      pickerEl.addEventListener("emoji-click", onEmojiClick);

      host.appendChild(pickerEl);

      // cleanup for this mount
      const cleanup = () => {
        pickerEl?.removeEventListener("emoji-click", onEmojiClick);
      };

      // store cleanup on element via dataset flag is overkill; just run on dispose
      (pickerEl as HTMLElement).dataset.mounted = "true";
      return cleanup;
    };

    let cleanupFn: (() => void) | undefined;

    mount()
      .then((c) => {
        cleanupFn = c;
      })
      .catch(() => {
        // If the picker fails, just keep UI usable; user can still type emoji manually
      });

    return () => {
      disposed = true;
      if (cleanupFn) cleanupFn();
      if (pickerEl && pickerEl.parentElement) {
        pickerEl.parentElement.removeChild(pickerEl);
      }
    };
  }, [open, onChange]);

  const popoverWidthClass = useMemo(() => {
    return "w-[min(24rem,calc(100vw-2rem))]";
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="(optional) choose an emoji"
          inputMode="text"
          autoComplete="off"
        />

        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
          aria-expanded={open}
        >
          Pick
        </button>
      </div>

      {open ? (
        <div
          ref={popoverRef}
          className={[
            "absolute left-0 top-[calc(100%+0.5rem)] z-50",
            popoverWidthClass,
            "rounded-3xl border border-border bg-card p-2 shadow-(--shadow-momentum)",
          ].join(" ")}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="max-h-88 overflow-hidden rounded-2xl">
            <div ref={pickerHostRef} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
