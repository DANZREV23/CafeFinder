import { execSync } from 'child_process';

const sqlUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const sqlPass = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
const sqlHost = process.env.SQL_HOST;
const sqlDb = process.env.SQL_DB_NAME || process.env.DB_NAME;

if (sqlUser && sqlPass && sqlHost && sqlDb) {
  const dbUrl = `postgresql://${sqlUser}:${encodeURIComponent(sqlPass)}@localhost/${sqlDb}?host=${sqlHost}`;
  console.log('Constructed URL. Running prisma db push...');
  try {
    execSync('npx prisma db push', {
      env: { ...process.env, PRISMA_DATABASE_URL: dbUrl },
      stdio: 'inherit'
    });
  } catch (e) {
    console.error('Prisma db push failed');
    process.exit(1);
  }
} else {
  console.error('Missing DB environment variables');
  process.exit(1);
}
