"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { IMAGES_MAX, IMAGES_MIN } from "@/lib/validation";

type Item = { key: string; url: string; remove: () => void };

// Big preview + thumbnail strip + "Add image" tile. Works on already-saved photo URLs
// (`kept`) and freshly picked files (`files`); the parent form owns both lists.
export default function PhotoUploader({
  kept,
  setKept,
  files,
  setFiles,
}: {
  kept: string[];
  setKept: React.Dispatch<React.SetStateAction<string[]>>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const items: Item[] = [
    ...kept.map((url) => ({ key: url, url, remove: () => setKept((cur) => cur.filter((u) => u !== url)) })),
    ...files.map((f, i) => ({
      key: `${f.name}-${f.lastModified}-${i}`,
      url: previews[i],
      remove: () => setFiles((cur) => cur.filter((_, j) => j !== i)),
    })),
  ];
  const total = items.length;
  const main = items[Math.min(selected, total - 1)];

  const add = (picked: File[]) => setFiles((cur) => [...cur, ...picked].slice(0, IMAGES_MAX - kept.length));

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-[#0f3d2e]">Upload images</h2>
        <p className="text-xs text-slate-500">
          Add {IMAGES_MIN}–{IMAGES_MAX} clear photos of your item ({total}/{IMAGES_MAX}).
        </p>
      </div>

      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={main.url} alt="Selected photo" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 text-xs font-bold uppercase tracking-widest text-slate-500 hover:border-[#0f3d2e] hover:text-[#0f3d2e]"
          >
            <PlusIcon className="size-6" aria-hidden />
            Add your first photo
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {items.map((item, i) => (
          <div key={item.key} className="relative aspect-square">
            <button
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setSelected(i)}
              className={`h-full w-full overflow-hidden ${main === item ? "ring-2 ring-[#0f3d2e]" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            </button>
            <button
              type="button"
              aria-label="Remove photo"
              onClick={item.remove}
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center bg-[#0f3d2e] text-white"
            >
              <XIcon className="size-3" aria-hidden />
            </button>
          </div>
        ))}
        {total < IMAGES_MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 border border-slate-300 text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:border-[#0f3d2e]"
          >
            <PlusIcon className="size-4" aria-hidden />
            Add image
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}
