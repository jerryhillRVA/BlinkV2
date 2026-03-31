const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, resolve } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  resolve: {
    alias: {
      '@blinksocial/contracts/validation': resolve(
        __dirname,
        '../../libs/blinksocial-contracts/src/lib/workspace/validation.ts'
      ),
      '@blinksocial/contracts': resolve(
        __dirname,
        '../../libs/blinksocial-contracts/src/index.ts'
      ),
      '@blinksocial/models': resolve(
        __dirname,
        '../../libs/blinksocial-models/src/index.ts'
      ),
      '@blinksocial/core': resolve(
        __dirname,
        '../../libs/blinksocial-core/src/index.ts'
      ),
    },
  },
  module: {
    // The Angular SSR middleware uses a dynamic import() to load the pre-built
    // server bundle at runtime. Webpack can't resolve it at compile time and
    // emits a "Critical dependency" warning, which Nx treats as flaky output.
    exprContextCritical: false,
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [
        './src/assets',
        { input: './src/mocks/data', output: 'data', glob: '**/*' },
        { input: './src/skills/definitions', output: 'skills/definitions', glob: '**/*' },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};
