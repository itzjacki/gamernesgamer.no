import next from 'eslint-config-next';

// eslint-config-next's default export is a ready-to-use flat-config array
// (Next plugin + rules, TypeScript setup, and ignores). Spread it directly;
// there are no named exports to pull a plugin/config out of.
const config = [
  ...next,
  {
    // The results layer and its fixtures are pure, non-React code. A fixture
    // helper named `use` trips react-hooks/rules-of-hooks (it matches any call
    // named `use`, assuming React's `use` hook). These files never run in a
    // component, so the rule does not apply here.
    files: ['src/lib/results/**'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];

export default config;
