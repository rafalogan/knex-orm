module.exports = {
  development: {
    default: 'dev_db',
    connections: {
      dev_db: { client: 'sqlite3', connection: { filename: ':memory:' } },
    },
  },
  test: {
    default: 'test_db',
    connections: {
      test_db: { client: 'sqlite3', connection: { filename: ':memory:' } },
    },
  },
  production: {
    default: 'prod_db',
    connections: {
      prod_db: { client: 'sqlite3', connection: { filename: './prod.db' } },
    },
  },
};
