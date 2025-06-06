module.exports = {
  development: {
    username: 'root',
    password: null,
    database: 'smartdiscounts',
    host: '127.0.0.1',
    dialect: 'mysql', // or 'postgres', 'sqlite'
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql',
  },
};
