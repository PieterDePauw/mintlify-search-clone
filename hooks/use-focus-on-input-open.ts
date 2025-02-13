// Import module
import { useEffect } from "react"

// Define æ custom hook that focuses on an input when it opens
export function useFocusOnInputOpen(open: boolean, ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) {
	useEffect(() => {
		if (open) ref.current?.focus()
	}, [open, ref])
}
