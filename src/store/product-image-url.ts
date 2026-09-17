import { apiUrl } from '../shared/api/api-client';

export const productImageUrl = (path: string): string => {
  if (/^\/shop\/images\/[0-9a-f-]+$/.test(path)) return apiUrl(path);
  if (/^\/images\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$/.test(path))
    return import.meta.env.BASE_URL + path.slice(1);
  return '';
};
