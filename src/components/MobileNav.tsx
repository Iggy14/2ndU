"use client";

import { useState } from "react";
import Image from "next/image";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Hamburger drawer shown below `md`. Links/buttons are passed in as children (rendered
// on the server in Nav) and the drawer closes when any of them is clicked.
export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:hidden"
      >
        <MenuIcon className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 gap-0 p-0">
        <SheetTitle className="px-6 pt-6 pb-2">
          <Image src="/logo.png" alt="2ndU" width={600} height={258} className="h-10 w-auto" />
        </SheetTitle>
        <div
          className="flex flex-col gap-1 px-3 py-2 [&_a]:rounded-lg [&_a]:px-3 [&_a]:py-3 [&_a]:text-base [&_a:hover]:bg-black/5 [&_button]:rounded-lg [&_button]:px-3 [&_button]:py-3 [&_button]:text-left [&_button]:text-base [&_button:hover]:bg-black/5"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a,button")) setOpen(false);
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
