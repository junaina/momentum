export default function OfflinePage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-sm text-center space-y-2">
        <h1 className="text-xl font-semibold">You’re offline</h1>
        <p className="text-sm text-muted-foreground">
          Momentum can’t reach the network right now. Check your connection and
          try again.
        </p>
      </div>
    </main>
  );
}
