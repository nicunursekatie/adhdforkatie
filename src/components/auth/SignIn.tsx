import { useState } from 'react';
import { Mail, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth';

type Mode = 'signin' | 'signup';

export function SignIn() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) return;
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const result =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(friendlyError(result.error));
      return;
    }
    if (mode === 'signup' && 'needsConfirmation' in result && result.needsConfirmation) {
      setNotice('Account created! Check your email to confirm, then sign in.');
      setMode('signin');
    }
    // On success with a session, AuthProvider flips us into the app automatically.
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="card w-full max-w-sm p-7">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Sparkles size={24} />
          </div>
          <h1 className="text-lg font-bold">ADHD Planner</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            made for the way your brain works — synced across your devices
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Email
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-brand-400 dark:border-gray-700">
              <Mail size={16} className="text-gray-400" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-brand-400 dark:border-gray-700">
              <Lock size={16} className="text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {notice && <p className="text-xs text-green-600">{notice}</p>}

          <button
            onClick={submit}
            disabled={loading || !email.trim() || !password}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button onClick={() => { setMode('signup'); setError(null); setNotice(null); }} className="font-semibold text-brand-600 hover:underline">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError(null); setNotice(null); }} className="font-semibold text-brand-600 hover:underline">
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Wrong email or password. Try again, or create an account.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'That email already has an account — switch to Sign in.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first (check your inbox).';
  return msg;
}
