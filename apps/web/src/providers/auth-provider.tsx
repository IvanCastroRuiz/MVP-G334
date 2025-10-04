import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuthStore } from '../store/auth-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { accessToken, setUser, setModules, clear } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!accessToken) {
        setIsReady(true);
        return;
      }
      try {
        const [profileResponse, modulesResponse] = await Promise.all([
          api.get('/auth/me'),
          api.get('/auth/me/modules'),
        ]);
        setUser(profileResponse.data);
        setModules(
          modulesResponse.data.map((module: any) => ({
            id: module.id,
            key: module.key,
            name: module.name,
            visibility: module.visibility,
          })),
        );
      } catch (error) {
        clear();
      } finally {
        setIsReady(true);
      }
    }

    bootstrap();
  }, [accessToken, clear, setModules, setUser]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="animate-pulse text-lg font-semibold">Loading workspace…</div>
      </div>
    );
  }

  return <>{children}</>;
}
