import { GripVertical, ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  id?: string;
  url: string;
  storage_path: string | null;
  alt_text: string | null;
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function ImageUploader({
  images,
  onChange,
  coverUrl,
  onCoverChange,
}: {
  images: GalleryImage[];
  onChange: (next: GalleryImage[]) => void;
  coverUrl: string | null;
  onCoverChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<GalleryImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setBusy(true);
    setError(null);
    const added: GalleryImage[] = [];
    try {
      for (const file of list) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("property-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data, error: signErr } = await supabase.storage
          .from("property-images")
          .createSignedUrl(path, TEN_YEARS);
        if (signErr || !data) throw signErr ?? new Error("Could not create image URL");
        added.push({ url: data.signedUrl, storage_path: path, alt_text: file.name });
      }
      const next = [...images, ...added];
      onChange(next);
      if (!coverUrl && next[0]) onCoverChange(next[0].url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (index: number) => {
    const img = images[index];
    if (!img) return;
    if (img.storage_path) {
      await supabase.storage.from("property-images").remove([img.storage_path]);
    }
    const next = images.filter((_, i) => i !== index);
    onChange(next);
    if (coverUrl === img.url) onCoverChange(next[0]?.url ?? null);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) void uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-elevated/50 px-6 py-10 text-center transition-colors",
          dragOver && "border-primary bg-elevated",
        )}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary-light" />
        ) : (
          <ImagePlus className="h-6 w-6 text-subtle" aria-hidden="true" />
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          Drag &amp; drop authorized property images here, or
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {images.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li
              key={img.url}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) reorder(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-border bg-card",
                coverUrl === img.url && "border-primary",
                dragIndex === i && "opacity-50",
              )}
            >
              <button
                type="button"
                onClick={() => setPreview(img)}
                className="block aspect-4/3 w-full"
                aria-label={`Preview image ${i + 1}`}
              >
                <img src={img.url} alt={img.alt_text ?? ""} className="h-full w-full object-cover" />
              </button>

              <span className="absolute left-2 top-2 grid h-7 w-7 cursor-grab place-items-center rounded-md bg-background/80 text-subtle">
                <GripVertical className="h-4 w-4" />
              </span>

              {coverUrl === img.url ? (
                <span className="absolute right-2 top-2 rounded-md bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  Cover
                </span>
              ) : null}

              <div className="flex items-center justify-between gap-2 border-t border-border p-2">
                <button
                  type="button"
                  onClick={() => onCoverChange(img.url)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Star className="h-3.5 w-3.5" /> Cover
                </button>
                <button
                  type="button"
                  onClick={() => void remove(i)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {preview ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-100 grid place-items-center bg-black/80 p-6"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={preview.url}
              alt={preview.alt_text ?? "Property image preview"}
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setPreview(null)}
              className="absolute -top-3 -right-3 grid h-9 w-9 place-items-center rounded-full bg-card text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
