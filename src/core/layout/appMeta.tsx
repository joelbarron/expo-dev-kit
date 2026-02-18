import { createContext, ReactNode, useContext, useMemo } from 'react';

export type JBAppMeta = {
  name?: string;
  maintenanceTitle?: string;
  maintenanceLine1?: string;
  maintenanceLine2?: string;
};

const defaultMeta: JBAppMeta = {
  name: 'App',
  maintenanceTitle: 'Nos encontramos en mantenimiento',
  maintenanceLine1: 'Por favor vuelve',
  maintenanceLine2: 'más tarde.'
};

const JBAppMetaContext = createContext<JBAppMeta>(defaultMeta);

export const JBAppMetaProvider = ({
  value,
  children
}: {
  value?: JBAppMeta;
  children: ReactNode;
}) => {
  const merged = useMemo(
    () => ({
      ...defaultMeta,
      ...(value ?? {})
    }),
    [value]
  );

  return <JBAppMetaContext.Provider value={merged}>{children}</JBAppMetaContext.Provider>;
};

export const useJBAppMeta = () => useContext(JBAppMetaContext);
