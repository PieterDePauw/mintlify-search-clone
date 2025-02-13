// Import modules
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine multiple classnames
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Escapes special regex characters so the user's query tokens don't break our search/highlighting regex.
export function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Calculates the Levenshtein distance between two strings.
 * @param a First string
 * @param b Second string
 * @returns The Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix = Array(b.length + 1)
		.fill(null)
		.map(() => Array(a.length + 1).fill(null))

	for (let i = 0; i <= a.length; i++) matrix[0][i] = i
	for (let j = 0; j <= b.length; j++) matrix[j][0] = j

	for (let j = 1; j <= b.length; j++) {
		for (let i = 1; i <= a.length; i++) {
			const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1, // deletion
				matrix[j - 1][i] + 1, // insertion
				matrix[j - 1][i - 1] + substitutionCost, // substitution
			)
		}
	}

	return matrix[b.length][a.length]
}

/**
 * Calculates a fuzzy match score between two strings.
 * @param str1 First string
 * @param str2 Second string
 * @returns A score between 0 and 1, where 1 is a perfect match
 */
export function fuzzyMatch(str1: string, str2: string): number {
	const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
	const maxLength = Math.max(str1.length, str2.length)
	return 1 - distance / maxLength
}

// Render highlighted text
export function renderHighlightedText(text: string): React.ReactNode {
	const parts = text.split(/(<mark>.*?<\/mark>)/g)
	return parts.map((part, index) => {
		if (part.startsWith("<mark>") && part.endsWith("</mark>")) {
			return (
				<mark key={index} className="bg-yellow-100 dark:bg-yellow-800">
					{part.slice(6, -7)}
				</mark>
			)
		}
		return part
	})
}

// Convert Markdown to plain text by removing all Markdown syntax
export function markdownToPlainText(text: string): string {
	// Remove all Markdown syntax
	return (
		text
			// Remove code blocks and their content
			.replace(/```[\s\S]*?```/g, "")
			// Remove inline code
			.replace(/`[^`]*`/g, "")
			// Remove headers
			.replace(/^#{1,6}\s+/gm, "")
			// Remove bold/italic
			.replace(/\*\*([^*]*)\*\*/g, "$1")
			.replace(/__([^_]*)__/g, "$1")
			.replace(/\*([^*]*)\*/g, "$1")
			.replace(/_([^_]*)_/g, "$1")
			// Remove links
			.replace(/\[([^\]]+)\]$$[^)]+$$/g, "$1")
			// Remove images
			.replace(/!\[([^\]]+)\]$$[^)]+$$/g, "$1")
			// Remove blockquotes
			.replace(/^\s*>\s+/gm, "")
			// Remove list markers
			.replace(/^\s*[-*+]\s+/gm, "")
			.replace(/^\s*\d+\.\s+/gm, "")
			// Remove HTML tags
			.replace(/<[^>]*>/g, "")
			// Remove emphasis
			.replace(/\*\*?(.*?)\*\*?/g, "$1")
			// Remove horizontal rules
			.replace(/^(?:---|\*\*\*|___)\s*$/gm, "")
			// Remove backslashes
			.replace(/\\([\\`*{}[\]()#+\-.!_>])/g, "$1")
			// Normalize whitespace
			.replace(/\s+/g, " ")
			// Trim leading/trailing whitespace
			.trim()
	)
}
