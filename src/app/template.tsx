// Re-mounts on navigation between top-level routes, so every page fades in.
// Opacity only: a transform here would break sticky/fixed children while it runs.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in duration-500 ease-out">{children}</div>;
}
