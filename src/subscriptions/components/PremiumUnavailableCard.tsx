import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { Box, HStack, Text, VStack } from '../../ui';
import { getColor } from '../../utils/colors';

export type PremiumUnavailableCardProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

/**
 * Card mostrado cuando los offerings de la tienda no se pudieron cargar
 * (Paid Apps Agreement pendiente, propagación, sin internet, etc.).
 * Usa los tokens de UI del app — primary color para el ícono y CTA.
 */
export const PremiumUnavailableCard: React.FC<PremiumUnavailableCardProps> = ({
  title,
  message,
  retryLabel,
  onRetry,
}) => {
  const primary = getColor('primary');
  const accent = primary?.[500] ?? '#10B981';
  const accentDeep = primary?.[700] ?? '#047857';
  const accentBg = primary?.[50] ?? '#ECFDF5';
  const borderColor = primary?.[200] ?? '#A7F3D0';

  return (
    <Box style={[styles.card, { backgroundColor: accentBg, borderColor }]}>
      <HStack space="md" style={styles.row}>
        <Box style={[styles.iconWrap, { backgroundColor: accent }]}>
          <MaterialIcons name="info-outline" size={20} color="#FFFFFF" />
        </Box>
        <VStack space="xs" style={styles.body}>
          <Text style={[styles.title, { color: accentDeep }]}>
            {title ?? 'Planes en preparación'}
          </Text>
          <Text style={styles.message}>
            {message ??
              'Estamos terminando de configurar los planes en la tienda. Vuelve en unos minutos.'}
          </Text>
          {onRetry ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onRetry}
              style={[styles.retryButton, { backgroundColor: accentDeep }]}
            >
              <Text style={styles.retryText}>{retryLabel ?? 'Reintentar'}</Text>
            </TouchableOpacity>
          ) : null}
        </VStack>
      </HStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  row: { alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '700' },
  message: { fontSize: 13, color: '#374151', lineHeight: 19 },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
});
