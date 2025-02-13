// Import modules
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"
import { neon } from "@neondatabase/serverless"

// Define the runMigrate function
const runMigrate = async () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not defined")
	}

	const sql = neon(process.env.DATABASE_URL)
	const db = drizzle(sql)

	console.log("Running migrations...")

	const start = Date.now()
	await migrate(db, { migrationsFolder: "lib/db/migrations" })
	const end = Date.now()

	console.log(`Migrations completed in ${end - start}ms`)

	process.exit(0)
}

// Run the migrate function
runMigrate().catch((err) => {
	console.error("Error running migrations:", err)
	process.exit(1)
})
