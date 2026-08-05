module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['last 2 versions', 'ie >= 11']
        },
        modules: false,
        useBuiltIns: 'entry',
        corejs: 3
      }
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-private-property-in-object',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: false
      }
    ],
    [
      'import',
      {
        libraryName: '@mui/material',
        libraryDirectory: '',
        camel2DashComponentName: false
      },
      'core'
    ],
    [
      'import',
      {
        libraryName: '@mui/icons-material',
        libraryDirectory: '',
        camel2DashComponentName: false
      },
      'icons'
    ]
  ],
  env: {
    production: {
      plugins: [
        'babel-plugin-transform-react-remove-prop-types',
        '@babel/plugin-transform-react-inline-elements',
        '@babel/plugin-transform-react-constant-elements',
        'transform-remove-console',
        'transform-remove-debugger'
      ]
    }
  }
};
