// ============================================
// Loading Spinner Component
// ============================================

export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
