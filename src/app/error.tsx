"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card grid place-items-center gap-3 p-10 text-center">
      <div className="font-display text-lg">Something went wrong</div>
      <p className="max-w-md text-[13px] text-mute">The page failed to load. Try again, and if it keeps happening please report it.</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </div>
  );
}
