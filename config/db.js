import pg from "pg";
import dotenv from "dotenv";
import { setTimeout as delay } from "timers/promises";

dotenv.config();

const { Pool } = pg;

pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const pool = new Pool(poolConfig);

let retries = 3;
while (retries > 0) {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");
    break;
  } catch (err) {
    retries--;
    console.error(
      `❌ Database connection failed (${retries} retries left):`,
      err.message
    );
    if (retries === 0) {
      console.error(
        "Fatal: Could not connect to database after multiple attempts"
      );
      process.exit(1);
    }
    await delay(2000);
  }
}

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

export default pool;
