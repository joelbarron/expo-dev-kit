export const YEAR_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
  ''
];

export const getMoneyAccountType = (type: string) => {
  switch (type) {
    case 'CREDIT':
      return 'Crédito';
    case 'DEBIT':
      return 'Débito';
    case 'CASH':
      return 'Efectivo';
    default:
      return '';
  }
};

export function splitEmojiPrefix(label?: string | null) {
  const value = (label ?? '').trim();
  if (!value) return { emoji: '•', text: '' };

  const chars = Array.from(value);
  const first = chars[0] ?? '•';
  const rest = chars.slice(1).join('').trim();

  const isEmoji =
    first.length > 1 ||
    (/\p{Extended_Pictographic}/u.test(first) && rest.length > 0);

  return {
    emoji: isEmoji ? first : '•',
    text: isEmoji ? rest : value
  };
}
