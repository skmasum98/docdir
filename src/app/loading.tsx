import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-[50vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-600 mx-auto animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Loading...</p>
      </div>
    </main>
  );
}
