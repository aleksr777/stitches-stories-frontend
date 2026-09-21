import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, expect, test } from 'vitest';
import { AuthContext } from '../src/features/auth/model/auth-context';
import CustomerRoute from '../src/features/auth/ui/customer-route';
import Checkout from '../src/store/checkout';
import { StoreContext } from '../src/store/context';
import { ProductPage } from '../src/store/products';
import StoreHeader from '../src/store/store-header';

const product = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'owner-test',
  name: 'Тестовое изделие',
  category: 'keychains',
  priceRub: 1000,
  description: 'Описание тестового изделия',
  materials: 'Хлопок',
  dimensions: '5 см',
  productionTime: 'По согласованию',
  images: [],
  stock: 2,
  featured: false,
  active: true,
  isDemo: false,
};

const auth = {
  isAuth: true,
  isInitializing: false,
  isEndingSession: false,
  role: 'admin',
  login: vi.fn(),
  confirmAdminLogin: vi.fn(),
  resendAdminLogin: vi.fn(),
  requestRegistration: vi.fn(),
  resendRegistration: vi.fn(),
  confirmRegistration: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
  logout: vi.fn(),
  endSession: vi.fn(),
  clearSession: vi.fn(),
};

const createStore = () => ({
  products: [product],
  documents: [],
  cart: [{ productId: product.id, quantity: 1 }],
  favorites: [],
  loading: false,
  error: '',
  retry: vi.fn(),
  setQuantity: vi.fn(),
  add: vi.fn(),
  clearCart: vi.fn(),
  toggleFavorite: vi.fn(),
  showDocument: vi.fn(),
});

const renderWithStore = (content, store = createStore()) =>
  render(
    <AuthContext.Provider value={auth}>
      <StoreContext.Provider value={store}>
        <MemoryRouter initialEntries={['/products/owner-test']}>{content}</MemoryRouter>
      </StoreContext.Provider>
    </AuthContext.Provider>,
  );

test('owner sees inactive cart and favorites controls in the header', () => {
  renderWithStore(<StoreHeader menu={false} setMenu={vi.fn()} openAuth={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Корзина' }).disabled).toBe(true);
  expect(screen.queryByRole('link', { name: /Корзина/ })).toBeNull();
  expect(screen.getByRole('button', { name: 'Избранное' }).disabled).toBe(true);
  expect(screen.queryByRole('link', { name: 'Избранное' })).toBeNull();
});

test('owner cannot add a product to the cart', () => {
  const store = createStore();
  renderWithStore(
    <Routes>
      <Route path="/products/:slug" element={<ProductPage />} />
    </Routes>,
    store,
  );
  const button = screen.getByRole('button', { name: 'Добавить в корзину' });
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(store.add).not.toHaveBeenCalled();
});

test('owner cannot open checkout even with a pre-existing cart', () => {
  renderWithStore(<Checkout />);
  expect(screen.getByRole('heading', { name: 'Корзина недоступна' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Отправить заявку мастеру' })).toBeNull();
});

test('owner cannot open the favorites route directly', () => {
  renderWithStore(
    <Routes>
      <Route path="/favorites" element={<CustomerRoute />}>
        <Route index element={<h1>Избранное</h1>} />
      </Route>
      <Route path="/forbidden" element={<h1>Доступ ограничен</h1>} />
    </Routes>,
  );
  expect(screen.getByRole('heading', { name: 'Доступ ограничен' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Избранное' })).toBeNull();
});
