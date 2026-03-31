export type JBPaymentMethodId = number | string;

export type JBPaymentMethod = {
  id: JBPaymentMethodId;
  cardBrand?: string | null;
  card_brand?: string | null;
  cardLast4?: string | null;
  card_last4?: string | null;
  expMonth?: number | null;
  exp_month?: number | null;
  expYear?: number | null;
  exp_year?: number | null;
  default?: boolean | null;
  [key: string]: unknown;
};
