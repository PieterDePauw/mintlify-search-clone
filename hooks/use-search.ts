// Import modules
import { useState, useEffect } from "react"
import { searchDocumentation } from "@/app/actions"
import { type SearchResultType } from "@/components/doc-search"

// useSearch hook
export function useSearch(initialQuery = "") {
	// State for the current search query
	const [query, setQuery] = useState<string>(initialQuery)

	// State for the current view (search results or chat)
	const [viewState, setViewState] = useState<"search" | "chat">("search")

	// State for search results
	const [results, setResults] = useState<SearchResultType[]>([])

	// State for loading indicator
	const [isSearchLoading, setIsSearchLoading] = useState(false)

	// State for the currently selected result index
	const [selectedIndex, setSelectedIndex] = useState(-1)

	// State for any error messages
	const [error, setError] = useState<string | null>(null)

	// Effect to perform search when query or viewState changes
	useEffect(() => {
		async function performSearch() {
			// Only search if there's a query and we're in search view
			if (!query || viewState !== "search") {
				setResults([])
				setError(null)
				return
			}

			setIsSearchLoading(true)
			setError(null)

			try {
				const searchResults = await searchDocumentation(query)
				setResults(searchResults)
			} catch (error) {
				console.error("Search failed:", error)
				setError("An error occurred while searching. Please try again.")
				setResults([])
			} finally {
				setIsSearchLoading(false)
			}
		}

		// Debounce the search to avoid too many requests
		const timeoutId = setTimeout(performSearch, 300)
		return () => clearTimeout(timeoutId)
	}, [query, viewState])

	// Effect to reset selected index when query changes
	useEffect(() => {
		setSelectedIndex(-1)
	}, [query])

	// Effect to update selected index based on view state and results
	useEffect(() => {
		if (viewState === "search") {
			setSelectedIndex(results.length > 0 ? 0 : -1)
		}
		if (viewState !== "search") {
			setSelectedIndex(-1)
		}
	}, [viewState, results])

	// Return all necessary state and functions
	return {
		query,
		setQuery,
		viewState,
		setViewState,
		isSearchLoading,
		results,
		selectedIndex,
		setSelectedIndex,
		error,
	}
}
