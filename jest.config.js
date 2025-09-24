export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^\\.(svg)$': '<rootDir>/__mocks__/svgMock.js'
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transform: {
    '^.+\\.svelte$': ['svelte-jester', { preprocess: true }],
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['<rootDir>/src/test/unit/**/*.test.ts']
};
