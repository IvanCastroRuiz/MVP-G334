import { FormEvent, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  AuthLoginDto,
  BoardSummaryDto,
  ModuleSummaryDto,
} from '@mvp/shared';
import api from '../api/client';
import { useAuthStore } from '../store/auth-store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser, setModules } = useAuthStore();
  const [email, setEmail] = useState('devadmin@example.com');
  const [password, setPassword] = useState('DevAdmin123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<AuthLoginDto>('/auth/login', { email, password });
      setTokens(response.data.accessToken, response.data.refreshToken);
      setUser(response.data.user);

      const modulesResponse = await api.get('/auth/me/modules');
      const modules = modulesResponse.data as ModuleSummaryDto[];
      setModules(modules);

      const accessibleModules = modules.filter((module) => module.isActive);
      const hasBoardsAccess = response.data.user.permissions.includes('boards:read');
      const includesBoardsModule = modules.some((module) => module.key === 'boards');

      let targetRoute: string | null = null;

      if (hasBoardsAccess && includesBoardsModule) {
        try {
          const boardsResponse = await api.get('/kanban/boards');
          const boards = boardsResponse.data as BoardSummaryDto[];
          targetRoute = boards.length > 0 ? `/board/${boards[0].id}` : '/board';
        } catch {
          targetRoute = '/board';
        }
      }

      if (!targetRoute) {
        const firstModule = accessibleModules.find((module) => module.key !== 'boards') ?? accessibleModules[0];
        if (firstModule) {
          targetRoute = firstModule.key === 'boards' ? '/board' : `/${firstModule.key}`;
        }
      }

      navigate(targetRoute ?? '/board');
    } catch (err: unknown) {
      const apiMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
          'string'
          ? (err as { response?: { data?: { message?: string } } }).response!.data!.message!
          : null;
      setError(apiMessage ?? 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/70 p-8 shadow-xl"
      >
        <h1 className="text-2xl font-semibold text-slate-100">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to your workspace</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setEmail(event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setPassword(event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-lg bg-sky-500 px-4 py-2 font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
