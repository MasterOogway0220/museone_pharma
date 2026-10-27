import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  connectTimeout: 10_000,
});

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
