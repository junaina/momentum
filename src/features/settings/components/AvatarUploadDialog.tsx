"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useUploadThing } from "@/lib/uploadthing";
import { useUpdateMe } from "@/features/auth/hooks/useUpdateMe";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string | null;
};

function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function AvatarUploadDialog({ open, onOpenChange, currentUrl }: Props) {
  const qc = useQueryClient();
  const updateMe = useUpdateMe();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileSize, setFileSize] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number>(0);

  // UploadThing: avatar route
  const { startUpload, isUploading } = useUploadThing("avatar", {
    onUploadProgress: (p) => setProgress(p),
    onUploadError: (e) => setError(e.message),
    onClientUploadComplete: async (res) => {
      const url = res[0]?.url;
      if (!url) {
        setError("Upload finished, but no URL was returned.");
        return;
      }

      try {
        await updateMe.mutateAsync({ image: url });
        // force anything using the `me` query to refresh
        await qc.invalidateQueries({ queryKey: ["me"] });
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save avatar.");
      }
    },
  });

  // cleanup preview object URL
  React.useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setLocalPreview(null);
      setFileName(null);
      setFileSize(null);
      setError(null);
      setProgress(0);
    }
  }, [open]);

  function acceptAndPreview(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WebP).");
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB free-tier friendly
    if (file.size > maxBytes) {
      setError("That file is too large. Please choose an image under 2MB.");
      return;
    }

    // revoke previous preview URL if any
    if (localPreview) URL.revokeObjectURL(localPreview);

    setSelectedFile(file);
    setFileName(file.name);
    setFileSize(file.size);
    setLocalPreview(URL.createObjectURL(file));
  }

  function onBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    acceptAndPreview(file); // this sets selectedFile + preview
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    acceptAndPreview(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Update avatar</DialogTitle>
        </DialogHeader>

        {/* Preview row */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={localPreview ?? currentUrl ?? ""}
              alt="Avatar preview"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-medium">Preview</div>
            <div className="text-xs text-muted-foreground">
              {fileName ? (
                <>
                  {fileName} {fileSize ? `• ${formatBytes(fileSize)}` : null}
                </>
              ) : (
                "Pick an image to see it here."
              )}
            </div>

            {isUploading ? (
              <div className="mt-2 text-xs text-muted-foreground">
                Uploading… {Math.round(progress)}%
              </div>
            ) : null}
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
          className="rounded-2xl border border-dashed border-border bg-card p-4 hover:bg-accent/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
              <ImageIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="text-sm font-medium">Drag & drop an image</div>
              <div className="text-xs text-muted-foreground">
                PNG/JPG/WebP • up to 2MB (free tier friendly)
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onBrowse}
              disabled={isUploading}
            />

            <Button
              type="button"
              variant="secondary"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => {
              if (!selectedFile) {
                setError("Pick an image first.");
                return;
              }
              setError(null);
              setProgress(0);
              startUpload([selectedFile]);
            }}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
