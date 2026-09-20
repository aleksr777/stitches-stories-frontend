import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import CustomScrollbar from '../src/components/scrollbar/custom-scrollbar';

test('custom store scrollbar appears for a document taller than the viewport', async () => {
  vi.spyOn(document, 'scrollingElement', 'get').mockReturnValue(document.documentElement);
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
