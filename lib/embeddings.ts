// Import modules
import { openai } from "@ai-sdk/openai"
import { embed } from "ai"
import { db } from "@/lib/db"
import { documents, type InsertDocument } from "@/lib/db/schema"

// Helper function to generate an embedding for a given content
export async function generateEmbedding(content: string): Promise<number[]> {
	const result = await embed({
		model: openai.embedding("text-embedding-3-small"),
		value: content,
	})
	return result.embedding
}

// Helper function to upsert a document in the database with its content and embedding
// prettier-ignore
export async function upsertDocument(path: string, content: string): Promise<void> {
	const embedding = await generateEmbedding(content)
	const document: InsertDocument = { path: path, content: content, embedding: embedding, updatedAt: new Date() }
	await db.insert(documents).values(document).onConflictDoUpdate({ target: documents.path, set: { content: document.content, embedding: document.embedding, updatedAt: document.updatedAt } })
}
