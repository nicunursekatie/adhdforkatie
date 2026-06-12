import { useState } from 'react';
import { Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';

export function SignIn() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await signInWithMagicLink(email.trim());
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="card w-full max-w-sm p-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Sparkles size={24} />
        </div>
        <h1 className="text-lg font-bold">ADHD Planner</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          made for the way your brain works — synced across your devices
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-green-50 px-4 py-5 text-sm text-green-800 dark:bg-green-500/10 dark:text-green-300">
            <CheckCircle2 className="mx-auto mb-2" size={28} />
            <p className="font-medium">Check your email</p>
            <p className="mt-1 text-green-700 dark:text-green-400">
              We sent a sign-in link to <span className="font-medium">{email}</span>. Open it on this device to log in.
            </p>
            <button onClick={() => setSent(false)} className="mt-3 text-xs font-medium underline">
              Use a different email
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Email
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-brand-400 dark:border-gray-700">
              <Mail size={16} className="text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="you@example.com"
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={submit}
              disabled={loading || !email.trim()}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send me a sign-in link'}
            </button>
            <p className="text-center text-xs text-gray-400">No password to remember. We email you a one-time link.</p>
          </div>
        )}
      </div>
    </div>
  );
}
