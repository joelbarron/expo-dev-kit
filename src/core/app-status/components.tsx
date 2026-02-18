import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useJBAppStatus } from './provider';

type AppStatusGateProps = {
  children: ReactNode;
  loadingFallback?: ReactNode;
  maintenanceFallback?: ReactNode;
  updateFallback?: ReactNode;
};

export const DefaultMaintenanceFallback = () => {
  return (
    <View style={[styles.container, styles.maintenance]}>
      <Text style={styles.title}>En mantenimiento</Text>
      <Text style={styles.message}>Vuelve más tarde.</Text>
    </View>
  );
};

export const DefaultRequireUpdateFallback = () => {
  return (
    <View style={[styles.container, styles.update]}>
      <Text style={styles.title}>Actualización requerida</Text>
      <Text style={styles.message}>Para continuar, actualiza la app.</Text>
    </View>
  );
};

export const DefaultLoadingFallback = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export const JBAppStatusGate = ({
  children,
  loadingFallback,
  maintenanceFallback,
  updateFallback
}: AppStatusGateProps) => {
  const status = useJBAppStatus();

  if (!status.isFetched || status.isLoading) {
    return loadingFallback ?? <DefaultLoadingFallback />;
  }

  if (status.blockingReason === 'maintenance') {
    return maintenanceFallback ?? <DefaultMaintenanceFallback />;
  }

  if (status.blockingReason === 'update') {
    return updateFallback ?? <DefaultRequireUpdateFallback />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  maintenance: {
    backgroundColor: '#1f2937'
  },
  update: {
    backgroundColor: '#111827'
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center'
  },
  message: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center'
  }
});
