import React, { createContext, useContext, useMemo } from 'react';
import { ModuleSummaryDto } from '@mvp/shared';

type ModulesResponse = {
  data?: ModuleSummaryDto[];
};

type AuthContextValue = {
  modules: ModuleSummaryDto[];
};

const AuthContext = createContext<AuthContextValue>({ modules: [] });

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const modulesResponse: ModulesResponse = useMemo(() => ({ data: [] }), []);

  const modules = useMemo<ModuleSummaryDto[]>(() => {
    return modulesResponse.data?.map((module): ModuleSummaryDto => ({ ...module })) ?? [];
  }, [modulesResponse.data]);

  const value = useMemo<AuthContextValue>(() => ({ modules }), [modules]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  return useContext(AuthContext);
};
