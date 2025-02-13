// Import modules
import { useState, useCallback } from "react"
import { generateAIResponse as generateAIResponseAction } from "@/app/actions"

// useAIChat hook
export function useAIChat({ query, viewState, setViewState }: { query: string; viewState: "search" | "chat"; setViewState: (state: "search" | "chat") => void }) {
	const [response, setResponse] = useState<string>("")
	const [question, setQuestion] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [sources, setSources] = useState<string[]>([])

	const generateAIResponse = useCallback(async (question: string) => {
		setIsLoading(true)
		setQuestion(question)
		setError(null)
		setResponse("")
		setSources([])

		try {
			const response = await generateAIResponseAction(question)

			if ("error" in response) {
				setError(response.error)
				return
			}

			const reader = response.getReader()
			const decoder = new TextDecoder()

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				const chunk = decoder.decode(value)
				const lines = chunk.split("\n").filter(Boolean)
				for (const line of lines) {
					if (line.startsWith("0:")) {
						const content = JSON.parse(line.slice(2))
						setResponse((prev) => prev + content)
					} else if (line.startsWith("1:")) {
						const source = JSON.parse(line.slice(2))
						setSources((prev) => [...prev, source])
					}
				}
			}
		} catch (error) {
			console.error("AI request failed:", error)
			setError("An unexpected error occurred. Please try again later.")
		} finally {
			setIsLoading(false)
		}
	}, [])

	function handleBack() {
		setViewState("search")
		setResponse("")
		setQuestion(null)
		setError(null)
		setSources([])
	}

	return { response, question, isLoading, error, sources, handleBack, generateAIResponse }
}
