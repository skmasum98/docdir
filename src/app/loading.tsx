export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-6xl min-w-0 px-3 py-5 sm:px-6 sm:py-8"
    >
      <span role="status" className="sr-only">
        Loading…
      </span>

      {/* Keeps the page tall during navigation so the footer stays
          below the fold instead of jumping into view while data loads. */}
      <div aria-hidden className="min-h-[80vh] animate-pulse space-y-5 sm:space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-slate-200 sm:h-8 sm:w-64" />
          <div className="h-4 w-32 rounded-lg bg-slate-100" />
        </div>

        {/* Search / filter bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
          <div className="h-5 w-28 rounded-lg bg-slate-100" />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <div className="h-12 flex-1 rounded-xl bg-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-200 sm:w-28" />
          </div>
        </div>

        {/* Content cards */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-7">
          <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="mt-3 space-y-2">
              <div className="h-9 rounded-xl bg-slate-100" />
              <div className="h-9 rounded-xl bg-slate-100" />
              <div className="h-9 rounded-xl bg-slate-100" />
              <div className="h-9 rounded-xl bg-slate-100" />
            </div>
          </div>

          <div className="min-w-0 space-y-3 sm:space-y-4">
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-full bg-slate-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
                    <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
                    <div className="h-4 w-1/3 rounded-lg bg-slate-100" />
                  </div>
                  <div className="hidden h-9 w-20 shrink-0 rounded-xl bg-slate-100 sm:block" />
                </div>
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <div className="h-11 flex-1 rounded-xl bg-slate-100" />
                  <div className="h-11 flex-1 rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
