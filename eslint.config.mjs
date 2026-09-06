import { nextEslintPlugin, nextFlatConfig } from 'eslint-config-next';

export default [
  ...nextFlatConfig,
  {
    plugins: { '@next/next': nextEslintPlugin },
  },
];
