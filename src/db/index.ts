import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "./schemas";

config({ path: ".env" });

const sql = neon(process.env.DATABASE_URI!);
export const db = drizzle({ client: sql, schema });