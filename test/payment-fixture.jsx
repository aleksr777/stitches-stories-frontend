import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../src/app';
import AuthProvider from '../src/features/auth/model/auth-provider';

export const invoiceId = '11111111-1111-4111-8111-111111111111';
const docs = ['offer', 'payment', 'returns', 'seller'].map((id) => ({
  id,
  title: id,
  type: 'agreement',
  version: 'archived-v1',
  sha256: 'a'.repeat(64),
  status: 'draft',
  notice: 'Проект',
  summary: [],
  sections: [['Условия', 'Условия именно этого счёта.']],
}));
export const invoiceFixture = {
  id: invoiceId,
  number: '123',
  orderNumber: 'ABC12345',
  status: 'ready',
  isTest: true,
  sellerName: 'Тестовый продавец',
  sellerInn: '000000000000',
  items: [{ productId: 'product1', name: 'Вышитое панно', quantity: 1, priceRub: 1200 }],
  subtotalRub: 1200,
  deliveryRub: 300,
  amountRub: 1500,
  fulfillment: 'Изготовление 5 дней, доставка согласована.',
  expiresAt: '2030-01-01T10:00:00Z',
  paidAt: null,
  canPay: true,
  documents: docs,
  paymentUrl: 'https://shop.example.test/payment/' + invoiceId,
};
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
export const startPaymentFlow = ({
  owner = false,
  customer = true,
  path = '/payment/' + invoiceId,
  failStart = false,
} = {}) => {
  const calls = [];
  let state = { ...invoiceFixture };
  let created = false;
  let failed = false;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const endpoint = new URL(url).pathname.replace(/^\/api/, '');
      const body = options.body ? JSON.parse(options.body) : null;
      calls.push({ endpoint, body, headers: options.headers, method: options.method });
      if (endpoint === '/auth/refresh-tokens')
        return owner || customer
          ? response({
              access_token: owner ? 'owner-token' : 'customer-token',
              access_token_expires: Date.now() / 1000 + 3600,
            })
          : response({}, 401);
      if (endpoint === '/users/me')
        return response({
          id: 1,
          name: owner ? 'Владелец' : 'Покупатель',
          role: owner ? 'admin' : 'user',
          email: owner ? 'owner@example.test' : 'buyer@example.test',
        });
      if (endpoint === '/auth/session')
        return new Response(null, { status: owner || customer ? 204 : 401 });
      if (endpoint === '/legal/documents') return response(docs);
      if (
        [
          '/shop/products',
          '/shop/categories',
          '/shop/admin/products',
          '/shop/admin/categories',
        ].includes(endpoint)
      )
        return response([]);
      if (endpoint === '/shop/admin/requests')
        return response([
          {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Покупатель',
            email: 'buyer@example.test',
            city: 'Заречный',
            phone: null,
            comment: '',
            subtotalRub: 1200,
            status: 'agreed',
            items: state.items,
            createdAt: new Date().toISOString(),
          },
        ]);
      if (endpoint === '/shop/admin/payments/config')
        return response({
          enabled: true,
          account: {
            id: 'owner-test',
            isTest: true,
            sellerName: state.sellerName,
            sellerInn: state.sellerInn,
          },
        });
      if (endpoint.endsWith('/payment') && endpoint.startsWith('/shop/admin/requests/')) {
        if (options.method === 'POST') {
          created = true;
          return response(state, 201);
        }
        return response(created ? state : null);
      }
      if (endpoint === '/shop/payments/' + invoiceId + '/view') return response(state);
      if (endpoint === '/shop/payments/' + invoiceId + '/start') {
        if (failStart && !failed) {
          failed = true;
          return response({ message: 'Попробуйте ещё раз' }, 503);
        }
        state = { ...state, status: 'pending' };
        return response({
          action: 'https://auth.robokassa.ru/Merchant/Index.aspx',
          fields: {
            MerchantLogin: 'stitches-test',
            OutSum: '1500.00',
            InvId: '123',
            IncCurrLabel: 'SBP',
            PaymentMethods: 'SBP',
            IsTest: '1',
            SignatureValue: 'c'.repeat(64),
          },
        });
      }
      return response({ message: 'Unexpected ' + endpoint }, 404);
    }),
  );
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <AuthProvider>
            <App />
          </AuthProvider>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return {
    calls,
    router,
    paid: () => {
      state = { ...state, status: 'paid', canPay: false, paidAt: new Date().toISOString() };
    },
  };
};
