import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

const LOCAL_API_URL = 'http://localhost:5174/api';

const isLocalApiHost = (hostname: string): boolean =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

const validateBasePath = (basePath: string): string => {
  if (!basePath.startsWith('/') || !basePath.endsWith('/')) {
    throw new Error('VITE_BASE_PATH must start and end with "/".');
  }
  if (basePath.includes('..') || basePath.includes('?') || basePath.includes('#')) {
    throw new Error('VITE_BASE_PATH must be a simple absolute path.');
  }
  return basePath;
};

const buildContentSecurityPolicy = (apiOrigin: string, production: boolean): string => {
  const developmentSockets = production ? '' : ' ws: wss:';
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}${developmentSockets}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
};

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const configuredApiUrl = process.env.VITE_API_URL ?? fileEnv.VITE_API_URL;
  const apiUrl = configuredApiUrl ?? LOCAL_API_URL;
  const basePath = validateBasePath(process.env.VITE_BASE_PATH ?? fileEnv.VITE_BASE_PATH ?? '/');
  const production = mode === 'production';

  if (production && !configuredApiUrl) {
    throw new Error(
      'VITE_API_URL is required for production builds. Refusing to build with a localhost fallback.',
    );
  }

  let parsedApiUrl: URL;
  try {
    parsedApiUrl = new URL(apiUrl);
  } catch {
    throw new Error('VITE_API_URL must be a valid absolute URL.');
  }

  if (production && parsedApiUrl.protocol !== 'https:' && !isLocalApiHost(parsedApiUrl.hostname)) {
    throw new Error('VITE_API_URL must use HTTPS for non-local production builds.');
  }

  const csp = buildContentSecurityPolicy(parsedApiUrl.origin, production);

  return {
    plugins: [
      react(),
      {
        name: 'inject-content-security-policy',
        transformIndexHtml: (html: string) => html.replace('__APP_CSP__', csp),
      },
    ],
    base: basePath,
  };
});
