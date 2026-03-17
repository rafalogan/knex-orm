module.exports = {
  default: 'primary',
  connections: {
    primary: {
      client: 'sqlite3',
      connection: { filename: ':memory:' },
    },
  },
};
