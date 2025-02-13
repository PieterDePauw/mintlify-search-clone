// Import modules
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges class names.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Escapes special regex characters so that a user’s query won’t break a regex.
 */
export function escapeRegex(str: string): string {
	// Use '\\$&' to prefix any special character with a backslash.
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix = Array.from({ length: b.length + 1 }, (_, j) =>
		Array(a.length + 1).fill(j === 0 ? 0 : j),
	)

	for (let i = 0; i <= a.length; i++) {
		matrix[0][i] = i
	}

	for (let j = 1; j <= b.length; j++) {
		for (let i = 1; i <= a.length; i++) {
			const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1
			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1, // deletion
				matrix[j - 1][i] + 1, // insertion
				matrix[j - 1][i - 1] + cost, // substitution
			)
		}
	}

	return matrix[b.length][a.length]
}

/**
 * Calculates a fuzzy match score between two strings (0 = no match, 1 = perfect match).
 */
export function fuzzyMatch(str1: string, str2: string): number {
	const distance = levenshteinDistance(str1, str2)
	const maxLength = Math.max(str1.length, str2.length)
	return maxLength === 0 ? 1 : 1 - distance / maxLength
}

/**
 * Renders text with <mark> tags where marked.
 */
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

/**
 * Converts Markdown text into plain text by removing markdown syntax.
 */
export function markdownToPlainText(text: string): string {
	return text
		.replace(/```[\s\S]*?```/g, "")
		.replace(/`[^`]*`/g, "")
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/\*\*([^*]*)\*\*/g, "$1")
		.replace(/__([^_]*)__/g, "$1")
		.replace(/\*([^*]*)\*/g, "$1")
		.replace(/_([^_]*)_/g, "$1")
		.replace(
			/$begin:math:display$([^$end:math:display$]+)\]$begin:math:text$[^)]+$end:math:text$/g,
			"$1",
		)
		.replace(
			/!$begin:math:display$([^$end:math:display$]+)\]$begin:math:text$[^)]+$end:math:text$/g,
			"$1",
		)
		.replace(/^\s*>\s+/gm, "")
		.replace(/^\s*[-*+]\s+/gm, "")
		.replace(/^\s*\d+\.\s+/gm, "")
		.replace(/<[^>]*>/g, "")
		.replace(/\*\*?(.*?)\*\*?/g, "$1")
		.replace(/^(?:---|\*\*\*|___)\s*$/gm, "")
		.replace(/\\([\\`*{}[\]()#+\-.!_>])/g, "$1")
		.replace(/\s+/g, " ")
		.trim()
}
