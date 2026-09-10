import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.ts';

declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

export const createPool = () => {
  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return global._mysqlPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema, mode: 'default' });
