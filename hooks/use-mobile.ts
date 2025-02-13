// Import modules
import { useState, useEffect } from "react"

// Define the mobile breakpoint constant
const MOBILE_BREAKPOINT = 768

// Define the useIsMobile hook
export function useIsMobile() {
	// > Use the useState hook to create a state variable called isMobile
	const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

	// > Use the useEffect hook to run the following code whenever the window's inner width changes
	useEffect(() => {
		// >> Define the onChange function to set the isMobile state based on a window width check
		const handleOnChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
		// >> Create a new MediaQueryList object called mql
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
		// >> Add the change event listener to the mql object
		mql.addEventListener("change", handleOnChange)
		// >> Call the onChange function to set the initial isMobile state
		handleOnChange()
		// >> Return a cleanup function to remove the event listener
		return () => mql.removeEventListener("change", handleOnChange)
	}, [window.innerWidth, MOBILE_BREAKPOINT, setIsMobile])

	// > Return the isMobile state value as a boolean
	return !!isMobile
}
