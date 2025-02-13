// Import modules
import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Configure the connection cache
neonConfig.fetchConnectionCache = true

// Ensure the DATABASE_URL environment variable is defined
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not defined")

// Define the Neon PostgreSQL connection
const sql = neon(process.env.DATABASE_URL)

// Export the Drizzle ORM database instance
export const db = drizzle(sql)
