import { useCallback } from "react"

export function useScrollIntoView() {
	const scrollToIndex = useCallback((index: number) => {
		const element = document.querySelector(`[data-result-index="${index}"]`) as HTMLElement
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "nearest" })
		}
	}, [])

	return scrollToIndex
}

export function useKeyboardNavigation({
	selectedIndex,
	setSelectedIndex,
	resultsLength,
	viewState,
	handleResultSelection,
	handleManualSubmit,
}: {
	selectedIndex: number
	setSelectedIndex: React.Dispatch<React.SetStateAction<number>>
	resultsLength: number
	viewState: "search" | "chat"
	handleResultSelection: (index: number) => void
	handleManualSubmit: () => void
}) {
	const scrollToIndex = useScrollIntoView()

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault()

				setSelectedIndex((prevIndex: number) => {
					const newIndex =
						e.key === "ArrowDown" ?
							prevIndex < resultsLength ?
								prevIndex + 1
							:	0
						: prevIndex > 0 ? prevIndex - 1
						: resultsLength

					scrollToIndex(newIndex)
					return newIndex
				})
			} else if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault()
				if (viewState === "chat") {
					handleManualSubmit()
				} else {
					handleResultSelection(selectedIndex)
				}
			}
		},
		[selectedIndex, resultsLength, viewState, handleResultSelection, handleManualSubmit, setSelectedIndex, scrollToIndex],
	)

	return { handleKeyDown }
}
