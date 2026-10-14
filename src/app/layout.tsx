import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { cn } from "@/lib/utils";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-sans-body", subsets: ["latin"] });
const serif = Libre_Baskerville({ variable: "--font-serif-display", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "2ndU – Second-hand for Rangsit students",
  description: "Buy and sell second-hand items with fellow Rangsit University students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={cn("h-full", "antialiased", jakarta.variable, serif.variable)}>
      <body className="flex min-h-full flex-col overflow-x-clip bg-white text-slate-900">
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-6 pt-0">{children}</main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          2ndU is run by students for students. Meet on campus and inspect items before you pay.
        </footer>
      </body>
    </html>
  );
}
