import type { LegalDocument, OrderRequest } from './types';

export type PaymentStatus = 'ready' | 'pending' | 'paid' | 'expired' | 'paid_review';
export type PaymentSummary = {
  id: string;
  status: PaymentStatus;
  amountRub: number;
  isTest: boolean;
};
export type PaymentInvoice = PaymentSummary & {
  number: string;
  orderNumber: string;
  sellerName: string;
  sellerInn: string;
  items: OrderRequest['items'];
  subtotalRub: number;
  deliveryRub: number;
  fulfillment: string;
  expiresAt: string;
  paidAt: string | null;
  documents: LegalDocument[];
  canPay: boolean;
  paymentUrl?: string;
};
export type PaymentSettings = {
  enabled: boolean;
  account: { id: string; isTest: boolean; sellerName: string; sellerInn: string } | null;
};
export type PaymentForm = { action: string; fields: Record<string, string> };
export const paymentStatusNames: Record<PaymentStatus, string> = {
  ready: 'Ожидает оплаты',
  pending: 'Ожидаем подтверждения оплаты',
  paid: 'Оплата получена',
  expired: 'Срок оплаты истёк',
  paid_review: 'Оплата получена — уточняем выполнение заказа',
};
