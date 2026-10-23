"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const arrow =
  "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center bg-white text-[#0f3d2e] shadow transition-colors hover:bg-[#0f3d2e] hover:text-white";

export default function ListingGallery({ images, title, sold }: { images: string[]; title: string; sold: boolean }) {
  const [photo, setPhoto] = useState(0);
  const many = images.length > 1;
  const go = (d: number) => setPhoto((p) => (p + d + images.length) % images.length);

  return (
    <div className="relative min-h-[24rem] overflow-hidden bg-slate-100 md:min-h-[32rem]">
      <Image
        key={photo}
        src={images[photo]}
        alt={title}
        fill
        priority
        sizes="(min-width: 768px) 50vw, 100vw"
        className={`animate-in fade-in duration-300 object-cover ${sold ? "opacity-60" : ""}`}
      />
      {many && (
        <>
          <div className="absolute inset-x-0 top-4 flex justify-center gap-2">
            {images.map((src, i) => (
              <button key={src} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`}
                className={`h-1 w-8 shadow transition-colors ${i === photo ? "bg-[#0f3d2e]" : "bg-white/70 hover:bg-white"}`} />
            ))}
          </div>
          <button onClick={() => go(-1)} aria-label="Previous photo" className={`${arrow} left-3`}><ChevronLeft className="size-5" /></button>
          <button onClick={() => go(1)} aria-label="Next photo" className={`${arrow} right-3`}><ChevronRight className="size-5" /></button>
        </>
      )}
    </div>
  );
}
