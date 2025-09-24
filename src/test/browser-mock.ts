// Mock for browser environment
export const browser = true;

// Mock for $app/environment
export const dev = process.env.NODE_ENV !== 'production';

// Mock for $app/stores
export const page = {
  subscribe: (fn: (value: any) => void) => {
    fn({});
    return () => {};
  }
};

// Mock for $app/navigation
export const goto = vi.fn();
export const invalidate = vi.fn();
export const invalidateAll = vi.fn();
export const preloadData = vi.fn();
export const preloadCode = vi.fn();

// Add to global scope for SvelteKit
Object.defineProperty(global, '$app/environment', {
  value: { browser, dev },
  writable: true
});

Object.defineProperty(global, '$app/stores', {
  value: { page },
  writable: true
});

Object.defineProperty(global, '$app/navigation', {
  value: { goto, invalidate, invalidateAll, preloadData, preloadCode },
  writable: true
});
