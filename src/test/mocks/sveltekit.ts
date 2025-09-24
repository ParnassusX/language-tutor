// Mock for @sveltejs/kit environment
export const browser = typeof window !== 'undefined';
export const dev = process.env.NODE_ENV === 'development';
export const building = false;
export const version = '1.0.0';
