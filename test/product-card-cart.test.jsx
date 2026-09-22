import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { AuthContext } from '../src/features/auth/model/auth-context';
import { StoreContext } from '../src/store/context';
import ProductCard from '../src/store/product-card';

const product = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'card-test',
  name: 'Тестовый брелок',
  category: 'keychains',
  priceRub: 1200,
  description: 'Тестовое описание',
  materials: 'Хлопок',
  dimensions: '5 см',
  productionTime: 'По согласованию',
  images: ['/shop/images/33333333-3333-4333-8333-333333333333'],
  stock: 3,
  featured: false,
  active: true,
  isDemo: false,
};

const auth = {
  isAuth: false,
  isInitializing: false,
  isEndingSession: false,
  role: null,
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

const Harness = () => {
  const [cart, setCart] = useState([]);
  const setQuantity = (id, quantity) => setCart(quantity > 0 ? [{ productId: id, quantity }] : []);
  const store = {
    products: [product],
    categories: [{ id: 'keychains', name: 'Брелоки' }],
    documents: [],
    cart,
    favorites: [],
    loading: false,
    error: '',
    retry: vi.fn(),
    add: (id) => setQuantity(id, 1),
    setQuantity,
    clearCart: () => setCart([]),
    toggleFavorite: vi.fn(),
    showDocument: vi.fn(),
  };
  return (
    <AuthContext.Provider value={auth}>
      <StoreContext.Provider value={store}>
        <MemoryRouter>
          <ProductCard product={product} />
        </MemoryRouter>
      </StoreContext.Provider>
    </AuthContext.Provider>
  );
};

test('product card uses one stretched product link and separate cart controls', () => {
  render(<Harness />);
  const productLink = screen.getByRole('link', { name: 'Тестовый брелок' });
  expect(productLink.getAttribute('href')).toBe('/products/card-test');
  expect(productLink.className).toContain('product-card-link');
  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(screen.getByRole('img', { name: 'Тестовый брелок' }).getAttribute('alt')).toBe(
    'Тестовый брелок',
  );

  fireEvent.click(screen.getByRole('button', { name: 'Добавить в корзину' }));
  expect(screen.getByLabelText(/Количество в корзине/).value).toBe('1');

  fireEvent.click(screen.getByRole('button', { name: /Увеличить количество/ }));
  expect(screen.getByLabelText(/Количество в корзине/).value).toBe('2');

  fireEvent.click(screen.getByRole('button', { name: /Уменьшить количество/ }));
  fireEvent.click(screen.getByRole('button', { name: /Уменьшить количество/ }));
  expect(screen.getByRole('button', { name: 'Добавить в корзину' })).toBeTruthy();
});
