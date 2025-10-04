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

  const normalizeModules = useMemo(() => {
    const mapModules = (moduleList: ModuleSummaryDto[]): ModuleSummaryDto[] =>
      moduleList.map((module) => ({
        ...module,
        children: module.children ? mapModules(module.children) : undefined,
      }));
    return mapModules;
  }, []);

  const modules = useMemo<ModuleSummaryDto[]>(() => {
    return modulesResponse.data ? normalizeModules(modulesResponse.data) : [];
  }, [modulesResponse.data, normalizeModules]);

  const value = useMemo<AuthContextValue>(() => ({ modules }), [modules]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  return useContext(AuthContext);
};
