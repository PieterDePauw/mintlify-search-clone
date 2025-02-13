// Import modules
import { useCallback, useEffect } from "react"

// useScrollIntoView hook
export function useScrollIntoView() {
	return useCallback((index: number) => {
		const element = document.querySelector(`[data-result-index="${index}"]`) as HTMLElement
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "nearest" })
		}
	}, [])
}

// useKeyboardNavigation hook
export function useKeyboardNavigation({
	selectedIndex,
	setSelectedIndex,
	resultsLength,
	viewState,
	onResultSelect,
	handleManualSubmit,
}: {
	selectedIndex: number
	setSelectedIndex: React.Dispatch<React.SetStateAction<number>>
	resultsLength: number
	viewState: "search" | "chat"
	onResultSelect: (index: number) => void
	handleManualSubmit: () => void
}) {
	const scrollToIndex = useScrollIntoView()

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault()
				setSelectedIndex((prevIndex: number) => {
					const newIndex =
						e.key === "ArrowDown"
							? prevIndex < resultsLength ? prevIndex + 1 : 0
							: prevIndex > 0 ? prevIndex - 1 : resultsLength
					scrollToIndex(newIndex)
					return newIndex
				})
			} else if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault()
				if (viewState === "chat") {
					handleManualSubmit()
				} else {
					onResultSelect(selectedIndex)
				}
			}
		},
		[selectedIndex, resultsLength, viewState, onResultSelect, handleManualSubmit, setSelectedIndex, scrollToIndex]
	)

	return { handleKeyDown }
}

// useKeyboardShortcut hook
export function useKeyboardShortcut({ key, callbackFn }: { key: string; callbackFn: () => void }) {
	useEffect(() => {
		function down(e: KeyboardEvent) {
			if (e.key === key && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				callbackFn()
			}
		}
		document.addEventListener("keydown", down)
		return () => document.removeEventListener("keydown", down)
	}, [key, callbackFn])
}
