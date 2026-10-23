"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Link to "/". Next only scrolls to the top when the route changes, so on the home
// page itself we scroll up by hand. The mobile menu closes itself via its own click handler.
export default function HomeLink(props: Omit<React.ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      href="/"
      onClick={(e) => {
        props.onClick?.(e);
        if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}
