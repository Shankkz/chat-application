// Spinner — full-page or inline loading state
export function Spinner({ size = 40 }) {
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="rounded-full border-4 border-white/10 border-t-brand-primary animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

// Full-screen loader
export function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900 space-y-4">
      <Spinner size={48} />
      <p className="text-light-300/40 text-sm font-medium animate-pulse">Loading…</p>
    </div>
  );
}

// Message skeleton — shown while chat history loads
export function MessageSkeleton() {
  const lines = [
    { own: false, w: 'w-48' },
    { own: true,  w: 'w-64' },
    { own: false, w: 'w-56' },
    { own: true,  w: 'w-40' },
    { own: false, w: 'w-72' },
  ];

  return (
    <div className="space-y-4 p-6 animate-pulse">
      {lines.map((l, i) => (
        <div key={i} className={`flex ${l.own ? 'justify-end' : 'justify-start'}`}>
          <div className={`${l.w} h-10 bg-white/5 rounded-2xl`} />
        </div>
      ))}
    </div>
  );
}

// Small inline spinner for buttons
export function ButtonSpinner() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
    />
  );
}
