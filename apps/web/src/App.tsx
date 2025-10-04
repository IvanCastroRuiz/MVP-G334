import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import type { ModuleSummaryDto } from '@mvp/shared';
import { useAuthStore } from './store/auth-store';
import LoginPage from './pages/login';
import KanbanBoardPage from './pages/kanban-board';
import HrDashboardPage from './pages/hr';
import { ProtectedRoute } from './components/protected-route';

function AppLayout() {
  const { user, modules, clear } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleModules = useMemo<ModuleSummaryDto[]>(() => {
    if (!user) {
      return [];
    }
    const hasRbacAccess = user.permissions.includes('rbac:read');
    return modules.filter(
      (module: ModuleSummaryDto) =>
        module.isActive &&
        (module.visibility === 'public' ||
          (module.visibility === 'dev_only' && hasRbacAccess)),
    );
  }, [modules, user]);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({ refreshToken: useAuthStore.getState().refreshToken }),
      });
    } catch (error) {
      // ignore
    } finally {
      clear();
      navigate('/login');
    }
  };

  const currentPath = location.pathname;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-50">
      <aside className="w-64 border-r border-slate-800 bg-slate-950/60">
        <div className="flex flex-col gap-2 p-6">
          <div>
            <h1 className="text-xl font-semibold">MVP CRM</h1>
            <p className="text-sm text-slate-400">{user?.name}</p>
          </div>
          <nav className="mt-6 space-y-2">
            {visibleModules.map((module: ModuleSummaryDto) => (
              <button
                key={module.id}
                onClick={() => navigate(module.key === 'boards' ? '/board' : `/${module.key}`)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-slate-800 ${
                  currentPath.startsWith(`/${module.key}`) ? 'bg-slate-800 text-sky-300' : 'text-slate-300'
                }`}
              >
                {module.name}
                {module.visibility === 'dev_only' && (
                  <span className="ml-2 rounded bg-sky-500/20 px-2 text-xs uppercase text-sky-300">
                    Dev
                  </span>
                )}
              </button>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-900 p-6">
        <Routes>
          <Route path="/board" element={<KanbanBoardPage />} />
          <Route path="/board/:boardId" element={<KanbanBoardPage />} />
          <Route path="/hr" element={<HrDashboardPage />} />
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppLayout />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
