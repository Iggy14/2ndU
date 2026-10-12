// The list lives in layout.tsx; this is the right-hand pane when no chat is open (hidden on mobile).
export default function InboxPage() {
  return (
    <div className="hidden flex-1 items-center justify-center bg-white md:flex">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Select a chat to start messaging</p>
    </div>
  );
}
