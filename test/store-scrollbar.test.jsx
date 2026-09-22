import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import CustomScrollbar from '../src/components/scrollbar/custom-scrollbar';

const mockAnimationFrames = () => {
  const pending = new Map();
  let id = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    pending.set(++id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frame) => pending.delete(frame));
  return () => {
    act(() => {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(0));
    });
  };
};

test('custom store scrollbar appears for a document taller than the viewport', async () => {
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2400);

  render(
    <MemoryRouter>
      <CustomScrollbar />
    </MemoryRouter>,
  );

  const scrollbar = await screen.findByRole('scrollbar', { name: 'Прокрутка страницы' });
  expect(scrollbar.getAttribute('aria-hidden')).toBe('false');
  expect(scrollbar.getAttribute('aria-valuemax')).toBe('100');
});

test('StrictMode can reschedule the initial frame after effect cleanup', () => {
  const flushFrame = mockAnimationFrames();
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2400);

  render(
    <StrictMode>
      <MemoryRouter>
        <CustomScrollbar />
      </MemoryRouter>
    </StrictMode>,
  );
  flushFrame();

  const scrollbar = screen.getByRole('scrollbar', { name: 'Прокрутка страницы' });
  expect(scrollbar.getAttribute('aria-hidden')).toBe('false');
  expect(scrollbar.tabIndex).toBe(0);
});

test('navigation with a pending frame does not freeze scrollbar updates', async () => {
  const flushFrame = mockAnimationFrames();
  const height = vi.spyOn(document.documentElement, 'scrollHeight', 'get');
  height.mockReturnValue(2400);
  const router = createMemoryRouter([{ path: '*', element: <CustomScrollbar /> }]);
  render(<RouterProvider router={router} />);

  // Navigate before the first measurement, as can happen during a redirect.
  await act(() => router.navigate('/catalog'));
  flushFrame();
  const scrollbar = screen.getByRole('scrollbar', { name: 'Прокрутка страницы' });

  height.mockReturnValue(window.innerHeight);
  fireEvent.resize(window);
  flushFrame();
  expect(scrollbar.getAttribute('aria-hidden')).toBe('true');
  expect(scrollbar.tabIndex).toBe(-1);

  height.mockReturnValue(2400);
  fireEvent.resize(window);
  flushFrame();
  expect(scrollbar.getAttribute('aria-hidden')).toBe('false');

  vi.spyOn(window, 'scrollY', 'get').mockReturnValue((2400 - window.innerHeight) / 2);
  fireEvent.scroll(window);
  flushFrame();
  expect(scrollbar.getAttribute('aria-valuenow')).toBe('50');
});
