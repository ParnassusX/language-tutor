// Mock for @sveltejs/kit/environment
export const browser = typeof window !== 'undefined';
export const dev = process.env.NODE_ENV === 'development';
export const building = false;
export const version = '1.0.0';

export const amp = false;
export const csr = true;
export const prerendering = false;
export const ssr = true;

// Mock for $app/environment
export const base = '';
export const basePath = '';
export const assets = '';

// Mock for $app/stores
export const getStores = () => ({});
export const navigating = {
  subscribe: (fn: (value: any) => void) => {
    fn({ from: null, to: null, type: 'link' });
    return () => {};
  }
};

export const page = {
  subscribe: (fn: (value: any) => void) => {
    fn({
      url: new URL('http://localhost:3000'),
      params: {},
      routeId: '/',
      status: 200,
      error: null,
      data: {},
      form: null
    });
    return () => {};
  }
};

export const updated = {
  subscribe: (fn: (value: boolean) => void) => {
    fn(false);
    return () => {};
  },
  check: () => Promise.resolve(false)
};

// Mock for $app/navigation
export const goto = (to: string, opts?: any) => Promise.resolve();
export const invalidate = (resource: string) => Promise.resolve();
export const invalidateAll = () => Promise.resolve();
export const preloadData = () => Promise.resolve({ status: 200, data: {} });
export const preloadCode = () => Promise.resolve();
