// Import modules
import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core"

// Define the documents table
export const documents = pgTable("documents", {
	id: serial("id").primaryKey(),
	path: text("path").notNull(),
	content: text("content").notNull(),
	embedding: jsonb("embedding").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Export the Document type
export type Document = typeof documents.$inferSelect

// Export the InsertDocument type
export type InsertDocument = typeof documents.$inferInsert
