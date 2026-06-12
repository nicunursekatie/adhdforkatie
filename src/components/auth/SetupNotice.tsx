import { Database } from 'lucide-react';

// Shown when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY aren't set yet.
export function SetupNotice() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg p-7">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <Database size={24} />
        </div>
        <h1 className="text-lg font-bold">Connect your Supabase project</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sync needs a Supabase backend. One-time setup, then it follows you across devices.
        </p>

        <ol className="mt-5 space-y-3 text-sm">
          <li className="flex gap-3">
            <Step n={1} />
            <span>
              Create a free project at{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="font-medium text-brand-600 underline">
                supabase.com/dashboard
              </a>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <Step n={2} />
            <span>
              In the SQL editor, run the schema in <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">supabase/schema.sql</code>.
            </span>
          </li>
          <li className="flex gap-3">
            <Step n={3} />
            <span>
              Copy <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">.env.example</code> to{' '}
              <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">.env</code> and paste your project URL + anon
              key (Project Settings → API).
            </span>
          </li>
          <li className="flex gap-3">
            <Step n={4} />
            <span>Restart the dev server. Full steps are in <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">SUPABASE_SETUP.md</code>.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
      {n}
    </span>
  );
}
