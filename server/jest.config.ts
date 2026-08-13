import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/**',
    '!src/jobs/**',
  ],
  coverageDirectory: 'coverage',
  globals: {
    'ts-jest': {
      tsconfig: { strict: false },
    },
  },
};

export default config;
