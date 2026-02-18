export type JBThemeColors = Record<string, any>;

const defaultColors: JBThemeColors = {
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22'
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  background: {
    0: '#070b10',
    50: '#0a1018',
    200: '#121b26',
    400: '#121b26',
    950: '#121b26',
    light: '#fbfbfb',
    dark: '#181719'
  },
  typography: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  muted: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  green: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22'
  },
  zinc: {
    300: '#d4d4d8',
    400: '#a1a1aa'
  },
  red: {
    500: '#ef4444',
    600: '#dc2626'
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const deepMerge = (target: JBThemeColors, source: JBThemeColors): JBThemeColors => {
  const result: JBThemeColors = { ...target };

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = deepMerge(targetValue as JBThemeColors, sourceValue as JBThemeColors);
      return;
    }

    result[key] = sourceValue;
  });

  return result;
};

let runtimeColors: JBThemeColors = defaultColors;

export const configureJBThemeColors = (colors?: JBThemeColors) => {
  runtimeColors = colors ? deepMerge(defaultColors, colors) : defaultColors;
};

export const getColor = (colorName: string) => runtimeColors[colorName];

export const materialPalette = [
  '#00BCD4',
  '#9575CD',
  '#FF5722',
  '#9C27B0',
  '#faa528',
  '#1976D2',
  '#009688',
  '#F44336',
  '#616161',
  '#3F51B5'
];
