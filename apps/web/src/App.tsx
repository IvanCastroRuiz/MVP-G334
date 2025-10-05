import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import type { ModuleSummaryDto } from '@mvp/shared';
import { useAuthStore } from './store/auth-store';
import LoginPage from './pages/login';
import KanbanBoardPage from './pages/kanban-board';
import HrEmployeesPage from './pages/hr-employees';
import HrLeavesPage from './pages/hr-leaves';
import HrAccessPage from './pages/hr-access';
import { ProtectedRoute } from './components/protected-route';

type ModuleTreeNode = ModuleSummaryDto & { children?: ModuleTreeNode[] };

const modulePathMap: Record<string, string> = {
  boards: '/board',
  'hr-employees': '/hr/employees',
  'hr-leaves': '/hr/leaves',
  'hr-access': '/hr/access',
};

const getModulePath = (key: string): string => modulePathMap[key] ?? `/${key}`;

const isModuleActive = (module: ModuleTreeNode, path: string): boolean => {
  const modulePath = getModulePath(module.key);
  if (path === modulePath || path.startsWith(`${modulePath}/`)) {
    return true;
  }
  return module.children?.some((child) => isModuleActive(child, path)) ?? false;
};

interface ModuleNavListProps {
  modules: ModuleTreeNode[];
  currentPath: string;
  level?: number;
  parentId?: string;
  isExpanded?: boolean;
}

const ModuleNavList = ({
  modules,
  currentPath,
  level = 0,
  parentId,
  isExpanded = true,
}: ModuleNavListProps) => {
  if (modules.length === 0) {
    return null;
  }

  return (
    <ul
      id={parentId}
      role={level === 0 ? 'tree' : 'group'}
      aria-hidden={level > 0 ? !isExpanded : undefined}
      className={clsx(
        'space-y-1',
        level > 0 && 'mt-1 border-l border-slate-800/60 pl-3',
        level > 0 && !isExpanded && 'hidden',
      )}
    >
      {modules.map((module) => (
        <ModuleNavItem
          key={module.id}
          module={module}
          level={level}
          currentPath={currentPath}
        />
      ))}
    </ul>
  );
};

interface ModuleNavItemProps {
  module: ModuleTreeNode;
  level: number;
  currentPath: string;
}

const ModuleNavItem = ({ module, level, currentPath }: ModuleNavItemProps) => {
  const navigate = useNavigate();
  const hasChildren = Boolean(module.children && module.children.length > 0);
  const targetPath = getModulePath(module.key);
  const isSelfActive = currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
  const isDescendantActive = hasChildren
    ? module.children!.some((child) => isModuleActive(child, currentPath))
    : false;
  const isActive = isSelfActive || isDescendantActive;
  const [isExpanded, setIsExpanded] = useState(() => (hasChildren ? isDescendantActive : false));

  useEffect(() => {
    if (hasChildren) {
      setIsExpanded(isDescendantActive);
    }
  }, [hasChildren, isDescendantActive]);

  const submenuId = `module-submenu-${module.id}`;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded((previous) => !previous);
    } else {
      navigate(targetPath);
    }
  };

  return (
    <li role="none">
      <button
        type="button"
        role="treeitem"
        onClick={handleClick}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-controls={hasChildren ? submenuId : undefined}
        aria-haspopup={hasChildren ? 'true' : undefined}
        aria-current={!hasChildren && isSelfActive ? 'page' : undefined}
        className={clsx(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400',
          isActive
            ? 'bg-slate-800 text-sky-300'
            : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100',
        )}
      >
        <span className="flex-1 text-left">{module.name}</span>
        {module.visibility === 'dev_only' && (
          <span className="rounded bg-sky-500/20 px-2 text-xs uppercase text-sky-300">Dev</span>
        )}
        {hasChildren && (
          <span
            aria-hidden="true"
            className={clsx(
              'inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 text-slate-400 transition-transform',
              isExpanded && 'rotate-90 text-sky-300 border-slate-600',
            )}
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 2.25 8.25 6 4.5 9.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </button>
      {hasChildren && module.children && (
        <ModuleNavList
          modules={module.children}
          currentPath={currentPath}
          level={level + 1}
          parentId={submenuId}
          isExpanded={isExpanded}
        />
      )}
    </li>
  );
};

function AppLayout() {
  const { user, modules, clear } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const hasRbacAccess = user?.permissions.includes('rbac:read') ?? false;

  const visibleModules = useMemo<ModuleTreeNode[]>(() => {
    if (!user) {
      return [];
    }

    const filterModule = (module: ModuleTreeNode): ModuleTreeNode | null => {
      const filteredChildren = module.children
        ? module.children
            .map((child) => filterModule(child))
            .filter((child): child is ModuleTreeNode => child !== null)
        : undefined;

      const isVisible =
        module.isActive &&
        (module.visibility === 'public' ||
          (module.visibility === 'dev_only' && hasRbacAccess));

      if (!isVisible && (!filteredChildren || filteredChildren.length === 0)) {
        return null;
      }

      return {
        ...module,
        children: filteredChildren && filteredChildren.length > 0 ? filteredChildren : undefined,
      };
    };

    return modules
      .map((module) => filterModule(module as ModuleTreeNode))
      .filter((module): module is ModuleTreeNode => module !== null);
  }, [modules, user, hasRbacAccess]);

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
          <nav className="mt-6">
            <ModuleNavList modules={visibleModules} currentPath={currentPath} />
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
          <Route path="/hr" element={<Navigate to="/hr/employees" replace />} />
          <Route path="/hr/employees" element={<HrEmployeesPage />} />
          <Route path="/hr/leaves" element={<HrLeavesPage />} />
          <Route path="/hr/access" element={<HrAccessPage />} />
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
