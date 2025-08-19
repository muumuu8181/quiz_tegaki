module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is circular',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      comment: 'This is an orphan module',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)node_modules/',
        ]
      },
      to: {}
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    }
  }
};