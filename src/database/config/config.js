require('dotenv').config();

function isLocalHost(host) {
  if (!host) return true;
  const h = host.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

/** Cloud Postgres (Azure, RDS, etc.) usually requires SSL — fixes "no encryption" in pg_hba */
function dialectOptions() {
  const host = process.env.DB_HOST;
  const forceSsl =
    process.env.DB_SSL === 'true' ||
    process.env.DB_SSL === '1' ||
    (host && !isLocalHost(host));

  if (!forceSsl) return {};

  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
  return {
    ssl: rejectUnauthorized
      ? { require: true, rejectUnauthorized: true }
      : { require: true, rejectUnauthorized: false },
  };
}

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  dialect: 'postgres',
  logging: false,
  dialectOptions: dialectOptions(),
};

module.exports = {
  development: base,
  production: base,
};
