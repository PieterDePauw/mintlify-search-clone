"use server"

// Import modules
import docs from "@/docs.json"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { markdownToPlainText, escapeRegex, fuzzyMatch } from "@/lib/utils"
import { type SearchResultType } from "@/components/doc-search"

/**
 * Calculates TF-IDF score for a term in a document.
 */
function calculateTfIdf(term: string, doc: string, allDocs: string[]): number {
	const exactMatches = (doc.toLowerCase().match(new RegExp(`\\b${escapeRegex(term.toLowerCase())}\\b`, "g")) || []).length
	const fuzzyMatches = allDocs.filter((d) => fuzzyMatch(term, d) > 0.8).length - exactMatches
	const tf = exactMatches + fuzzyMatches * 0.5 // Fuzzy matches count for half
	const idf = Math.log((allDocs.length + 1) / (fuzzyMatches + exactMatches + 1)) + 1
	return tf * idf
}

/**
 * Calculates the proximity score for multi-word queries.
 */
function calculateProximityScore(text: string, query: string): number {
	const words = query.toLowerCase().split(/\s+/)
	if (words.length < 2) return 0

	const indices = words.map((word) => {
		const bestMatch = text
			.toLowerCase()
			.split(/\s+/)
			.reduce(
				(best, current, index) => {
					const score = fuzzyMatch(word, current)
					return score > best.score ? { score, index } : best
				},
				{ score: 0, index: -1 },
			)
		return bestMatch.index
	})

	const validIndices = indices.filter((index) => index !== -1)
	if (validIndices.length < 2) return 0

	const maxDistance = Math.max(...validIndices) - Math.min(...validIndices)
	return 1 / (maxDistance + 1) // Normalize to [0, 1]
}

/**
 * Highlights each token in the given text by wrapping it with <mark> tags.
 */
function highlightMatches(text: string, tokens: string[]): string {
	let highlighted = text
	tokens.forEach((token) => {
		const exactRegex = new RegExp(`\\b${escapeRegex(token)}\\b`, "gi")
		highlighted = highlighted.replace(exactRegex, (match) => `<mark class="exact-match">${match}</mark>`)

		const words = highlighted.split(/\s+/)
		const highlightedWords = words.map((word) => {
			if (!word.includes("<mark") && fuzzyMatch(token, word) > 0.8) {
				return `<mark class="fuzzy-match">${word}</mark>`
			}
			return word
		})
		highlighted = highlightedWords.join(" ")
	})
	return highlighted
}

/**
 * Finds the most relevant snippet of the content based on the query tokens.
 */
function findMostRelevantSnippet(content: string, tokens: string[], snippetLength = 200): string {
	const words = content.split(/\s+/)
	let bestScore = 0
	let bestIndex = 0

	for (let i = 0; i < words.length; i++) {
		const snippet = words.slice(i, i + 20).join(" ")
		const score = tokens.reduce((sum, token) => sum + fuzzyMatch(token, snippet), 0)
		if (score > bestScore) {
			bestScore = score
			bestIndex = i
		}
	}

	const start = Math.max(0, bestIndex - 5)
	const end = Math.min(words.length, start + Math.ceil(snippetLength / 5))
	return (start > 0 ? "..." : "") + words.slice(start, end).join(" ") + (end < words.length ? "..." : "")
}

/**
 * Searches the docs by tokenizing the query, filtering for relevant docs,
 * adding a sophisticated relevance score, highlighting, and sorting by score.
 */
export async function searchDocumentation(query: string): Promise<SearchResultType[]> {
	if (!query?.trim()) {
		console.info("No query was set")
		return []
	}

	try {
		const tokens = query
			.toLowerCase()
			.split(/\s+/)
			.map((t) => t.trim())
			.filter(Boolean)
		const allContent = docs.map((doc) => doc.content)

		const results: SearchResultType[] = docs.map((doc) => {
			const plainContent = markdownToPlainText(doc.content)
			const plainTitle = markdownToPlainText(doc.title)
			const relevantSnippet = findMostRelevantSnippet(plainContent, tokens)

			// Calculate scores
			const titleScore = tokens.reduce((score, token) => {
				const exactMatch = plainTitle.toLowerCase().includes(token.toLowerCase()) ? 2 : 0
				const fuzzyMatchScore = fuzzyMatch(token, plainTitle) > 0.8 ? 1 : 0
				return score + calculateTfIdf(token, plainTitle, allContent) * (exactMatch || fuzzyMatchScore)
			}, 0)

			const contentScore = tokens.reduce((score, token) => {
				const exactMatch = relevantSnippet.toLowerCase().includes(token.toLowerCase()) ? 2 : 0
				const fuzzyMatchScore = fuzzyMatch(token, relevantSnippet) > 0.8 ? 1 : 0
				return score + calculateTfIdf(token, relevantSnippet, allContent) * (exactMatch || fuzzyMatchScore)
			}, 0)

			const proximityScore = calculateProximityScore(relevantSnippet, query) * 5 // Adjust weight as needed

			const pathScore = tokens.reduce((score, token) => {
				const exactMatch = doc.path.toLowerCase().includes(token.toLowerCase()) ? 1 : 0
				const fuzzyMatchScore = fuzzyMatch(token, doc.path) > 0.8 ? 0.5 : 0
				return score + (exactMatch || fuzzyMatchScore)
			}, 0)

			const totalScore = titleScore + contentScore + proximityScore + pathScore

			return {
				...doc,
				id: doc.path.toString(),
				content: plainContent,
				highlightedTitle: highlightMatches(plainTitle, tokens),
				highlightedContent: highlightMatches(relevantSnippet, tokens),
				score: totalScore,
			}
		})

		// Filter out results with very low scores
		const threshold = 0.01 // Adjust this value as needed
		return results.filter((result) => result.score > threshold).sort((a, b) => b.score - a.score)
	} catch (error) {
		console.error("Search failed:", error)
		if (error instanceof Error) {
			throw new Error(`Search failed: ${error.message}`)
		} else {
			throw new Error(`Search failed: ${JSON.stringify(error)}`)
		}
	}
}

/**
 * Calls an AI model to provide a documentation-related answer to the user query.
 */
export async function generateAIResponse(query: string) {
	if (!query?.trim()) {
		console.error("No query was set")
		return { error: "Please provide a question to answer." }
	}

	const apiKey = process.env.OPENAI_API_KEY

	if (!apiKey) {
		console.error("OPENAI_API_KEY environment variable is not accessible")
		return {
			error: "OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.",
		}
	}

	try {
		const stream = streamText({
			model: openai("gpt-4o"),
			prompt: `Answer the following documentation-related question: ${query}`,
			system: `You are a helpful documentation assistant. Provide clear, concise answers about the content of this technical documentation.`,
			maxTokens: 500,
			temperature: 0.7,
		})

		return stream.toDataStream()
	} catch (error) {
		console.error("AI response generation failed:", error)
		return { error: "Failed to generate AI response. Please try again later." }
	}
}
