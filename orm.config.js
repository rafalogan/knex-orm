/** @type {import('knex-orm').OrmConfig} */
module.exports = {
  default: 'primary',
  connections: {
    primary: {
      client: 'sqlite3',
      connection: {
        filename: process.env.DB_PATH || ':memory:',
      },
      pool: { min: 0, max: 5 },
    },
  },
};
