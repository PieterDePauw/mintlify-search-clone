"use client"

// Import modules
import React, { useRef, useState, type Dispatch, type RefObject, type SetStateAction, type KeyboardEvent } from "react"
import crypto from "crypto"
import { useTheme } from "next-themes"
import { SearchIcon, CommandIcon, ArrowLeftIcon, ChevronRightIcon, SparklesIcon, AlertCircleIcon, CheckCircle2Icon, FileTextIcon, Share2Icon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { useSearch } from "@/hooks/use-search"
import { useAIChat } from "@/hooks/use-ai-chat"
import { useKeyboardShortcut, useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { useFocusOnInputOpen } from "@/hooks/use-focus-on-input-open"
import { cn, renderHighlightedText } from "@/lib/utils"

// Define the HTTP methods
const methods = ["GET", "POST", "PUT", "DELETE"] as const

// Define a type for the HTTP methods
export type HTTPMethodTypes = (typeof methods)[number]

// Define the method styles
export const METHOD_STYLES: Record<HTTPMethodTypes, string> = {
	GET: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
	POST: "bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
	PUT: "bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
	DELETE: "bg-red-100/80 text-red-700 dark:bg-red-900/50 dark:text-red-300",
} as const

// Define the DocumentationResult interface
export interface DocumentationResult {
	title: string
	path: string
	content: string
}

// Define the SearchResultType interface
export interface SearchResultType extends DocumentationResult {
	highlightedContent: string
	highlightedTitle: string
	method?: HTTPMethodTypes
	score: number
}

// Define the SearchResultsListProps interface
interface SearchResultsListProps {
	error: string | null
	isLoading: boolean
	onAskAI: () => void
	onResultSelect: (index: number) => void
	query: string
	results: SearchResultType[]
	selectedIndex: number
}

// Define the AIPropsType interface
interface AIPropsType {
	response: string
	question: string | null
	isLoading: boolean
	error: string | null
	sources: { id: string; title: string }[]
}

// Define the SearchModalProps interface
interface SearchModalProps {
	aiProps: AIPropsType
	handleBack: () => void
	handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
	handleManualSubmit: () => void
	inputRef: RefObject<HTMLInputElement | null>
	open: boolean
	query: string
	setOpen: Dispatch<SetStateAction<boolean>>
	setQuery: Dispatch<SetStateAction<string>>
	searchProps: SearchResultsListProps
	viewState: "search" | "chat"
}

// Helper function to get the icon based on the loading and error states
function getIcon({ isLoading, error }: { isLoading: boolean; error: string | null }) {
	if (isLoading) return <SparklesIcon className="mt-1 h-5 w-5 animate-pulse text-blue-500" />
	if (error) return <AlertCircleIcon className="mt-1 h-5 w-5 text-red-500" />
	if (!isLoading && !error) return <CheckCircle2Icon className="mt-1 h-5 w-5 text-blue-500" />
}

// AIChatResponse component
export function AIChatResponse({
	question,
	response,
	isLoading,
	error,
	sources,
}: {
	question: string | null
	response: string | null
	isLoading: boolean
	error: string | null
	sources?: { id: string; title: string }[]
}) {
	// > Use the useTheme hook to get the current theme
	const { theme } = useTheme()

	// > Return the JSX for the AI chat response
	return (
		<div className={cn("border-b p-4", theme === "dark" ? "border-zinc-700/40" : "border-zinc-200")}>
			<div className="flex items-start gap-4">
				{getIcon({ isLoading, error })}
				<div className="flex-1">
					<div className={cn("mb-4 font-medium", theme === "dark" ? "text-zinc-200" : "text-zinc-900")}>{question}</div>
					{isLoading ?
						<>
							<div className="prose prose-sm dark:prose-invert mb-4 whitespace-pre-wrap">{response}</div>
							<div className="inline-block h-4 w-2 animate-pulse bg-blue-500" />
						</>
					: error ?
						<div className="text-red-500">{error}</div>
					:	<>
							<div className="prose prose-sm dark:prose-invert mb-4 whitespace-pre-wrap">{response}</div>
							{sources && (
								<div className="mt-4 border-t pt-4 dark:border-zinc-700/40">
									<h4 className="mb-2 text-sm font-semibold">Sources:</h4>
									<ul className="list-none pl-0 text-sm text-zinc-600 dark:text-zinc-400">
										{sources.map((source) => (
											<li key={source.id} className="mb-1 flex items-center">
												<FileTextIcon className="mr-2 h-4 w-4" /> {source.title}
											</li>
										))}
									</ul>
								</div>
							)}
							<div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-zinc-700/40">
								<div className="flex gap-2">
									<Button variant="outline" size="sm" className="transition-all duration-200">
										<ThumbsUpIcon className="mr-1 h-4 w-4" /> Helpful
									</Button>
									<Button variant="outline" size="sm" className="transition-all duration-200">
										<ThumbsDownIcon className="mr-1 h-4 w-4" /> Not helpful
									</Button>
								</div>
								<Button variant="outline" size="sm" className="transition-all duration-200">
									<Share2Icon className="mr-1 h-4 w-4" /> Share
								</Button>
							</div>
						</>
					}
				</div>
			</div>
		</div>
	)
}

// SearchInputField component
export function SearchInputField({
	viewState,
	query,
	setQuery,
	goBack,
	onKeyDown,
	inputRef,
	submitChatQuery,
}: {
	viewState: "search" | "chat"
	query: string
	setQuery: Dispatch<SetStateAction<string>>
	goBack: () => void
	onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
	inputRef: RefObject<HTMLInputElement | null>
	submitChatQuery: () => void
}) {
	// > Define a function to handle input key down events
	function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			if (viewState === "chat") submitChatQuery()
			else onKeyDown(e)
		} else onKeyDown(e)
	}

	// > Return the JSX for the search input field
	return (
		<div className="flex items-center gap-2 text-zinc-400">
			<div className="flex w-8 justify-center">
				{viewState === "chat" ?
					<Button variant="ghost" size="sm" onClick={goBack} className="h-8 w-8 p-0">
						<ArrowLeftIcon className="h-4 w-4 transition-colors duration-200" />
					</Button>
				:	<SearchIcon className="h-4 w-4 transition-colors duration-200" />}
			</div>
			<input
				ref={inputRef}
				className="flex-1 bg-transparent text-zinc-700 outline-none transition-colors duration-200 placeholder:text-zinc-500 dark:text-zinc-200"
				placeholder={viewState === "chat" ? "Ask a follow-up question..." : "Search documentation..."}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={handleInputKeyDown}
			/>
		</div>
	)
}

// SearchTriggerButton component
function SearchTriggerButton({ setOpen }: { setOpen: (value: boolean) => void }) {
	return (
		<Button onClick={() => setOpen(true)} variant="outline" className="group relative w-full justify-start text-sm text-muted-foreground transition-all duration-300 hover:bg-accent sm:pr-12 md:w-40 lg:w-64">
			<SearchIcon className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
			<span className="hidden lg:inline-flex">Search documentation</span>
			<span className="inline-flex lg:hidden">Search...</span>
			<kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-semibold opacity-100 transition-opacity group-hover:opacity-70 dark:border-neutral-800/50 dark:bg-neutral-950 sm:flex">
				<CommandIcon className="size-2.5" strokeWidth={2.5} />
				{"K"}
			</kbd>
		</Button>
	)
}

// AskAIOption component
function AskAIOption({ query, isSelected, onClick }: { query: string; isSelected: boolean; onClick: () => void }) {
	// > Use the useTheme hook to get the current theme
	const { theme } = useTheme()

	// > Return the JSX for the "Ask AI" option
	return (
		<div
			className={cn(
				"flex cursor-pointer items-center gap-4 border-b p-4 transition-all duration-200",
				theme === "dark" ? "border-zinc-700/40" : "border-zinc-200",
				isSelected ? "bg-zinc-100 dark:bg-zinc-800" : "",
				"hover:bg-zinc-100 dark:hover:bg-zinc-800",
			)}
			onClick={onClick}
		>
			<SparklesIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
			<div className="flex-1">
				<div className={cn("font-medium", theme === "dark" ? "text-zinc-200" : "text-zinc-900")}>
					Can you tell me about <span className="text-blue-500">{query}</span>?
				</div>
				<div className="text-sm text-zinc-500 dark:text-zinc-400">Use AI to answer your question</div>
			</div>
			<ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-zinc-400 transition-transform duration-200 group-hover:translate-x-1" />
		</div>
	)
}

// SearchResultsList component
export function SearchResultsList({ query, results, selectedIndex, onResultSelect }: SearchResultsListProps) {
	// > Use the useTheme hook to get the current theme
	const { theme } = useTheme()

	// > Define a function to split the path into parts
	function splitPath(path: string) {
		return path.split(" > ")
	}

	// > Return the JSX for the search results list
	return (
		<>
			{query && <AskAIOption query={query} isSelected={selectedIndex === results.length} onClick={() => onResultSelect(results.length)} />}
			{results.map((result, index) => (
				<div
					key={index}
					className={cn(
						"cursor-pointer border-b p-4 transition-all duration-200",
						selectedIndex === index ? "bg-zinc-100 dark:bg-zinc-800" : "",
						theme === "dark" ? "border-zinc-700/40" : "border-zinc-200",
						"hover:bg-zinc-100 dark:hover:bg-zinc-800",
					)}
					onClick={() => onResultSelect(index)}
					data-result-index={index}
				>
					<div className="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
						{result.method && methods.includes(result.method) ?
							<span className={cn("inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-medium", METHOD_STYLES[result.method])}>{result.method}</span>
						:	null}
						<span className="flex items-center text-xs">
							{splitPath(result.path).map((part, idx) => (
								<span key={idx} className="flex items-center">
									<span className="transition-colors duration-200 hover:text-zinc-700 dark:hover:text-zinc-300">{part}</span>
									{idx < splitPath(result.path).length - 1 && <ChevronRightIcon className="mx-1 h-3 w-3 text-zinc-400" />}
								</span>
							))}
						</span>
					</div>
					<div className={cn("mb-1 font-medium", theme === "dark" ? "text-zinc-200" : "text-zinc-900")}>{renderHighlightedText(result.highlightedTitle)}</div>
					<div className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{renderHighlightedText(result.highlightedContent)}</div>
				</div>
			))}
		</>
	)
}

// SearchModal component
function SearchModal({ open, setOpen, inputRef, viewState, query, setQuery, handleBack, handleKeyDown, handleManualSubmit, searchProps, aiProps }: SearchModalProps) {
	// > Use the useTheme hook to get the current theme
	const { theme } = useTheme()

	// > Destructure the searchProps and aiProps
	const { results, selectedIndex, error, onAskAI, onResultSelect } = searchProps
	const { response, question, isLoading: isAILoading, error: aiError, sources } = aiProps

	// > Return the JSX for the search modal
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				className={cn(
					"overflow-hidden rounded-xl border p-0 shadow-2xl sm:max-w-[750px]",
					"transition-all duration-300 ease-in-out",
					theme === "dark" ? "border-zinc-700/40 bg-zinc-900" : "border-zinc-200 bg-white",
				)}
				title={viewState === "chat" ? "AI Chat" : "Search Documentation"}
				description={viewState === "chat" ? "Ask follow-up questions or get AI-powered answers" : "Search through the documentation or ask AI for help"}
			>
				<DialogHeader className="border-b border-zinc-200 p-3 dark:border-zinc-700/40">
					<SearchInputField viewState={viewState} query={query} setQuery={setQuery} goBack={handleBack} onKeyDown={handleKeyDown} inputRef={inputRef} submitChatQuery={handleManualSubmit} />
				</DialogHeader>

				<div
					className={cn(
						"scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent overflow-y-auto transition-all duration-300 ease-in-out",
						query ? "max-h-[60vh]" : "max-h-0",
					)}
				>
					{viewState === "search" && (
						<>
							{error ?
								<div className="p-4 text-red-500">{error}</div>
							:	<SearchResultsList query={query} results={results} selectedIndex={selectedIndex} onResultSelect={onResultSelect} onAskAI={() => onAskAI} error={error} isLoading={isAILoading} />}
						</>
					)}

					{viewState === "chat" && <AIChatResponse question={question} response={response} isLoading={isAILoading} error={aiError} sources={sources} />}
				</div>

				<DialogFooter className="flex flex-row items-center justify-between border-t border-zinc-200 p-2 text-xs text-zinc-500 dark:border-zinc-700/40 dark:text-zinc-400">
					<span className="flex items-center">
						<span className="mr-2">↑↓</span>
						<span>to navigate</span>
					</span>
					<span className="flex items-center">
						<span className="mr-1">⏎</span>
						<span>to select</span>
					</span>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// DocumentationSearch component
export function DocumentationSearch() {
	// > Use the useSearch hook to get the state of the search dialog (i.e. open or closed)
	const [open, setOpen] = useState(false)

	// > Use the useRef hook to create a reference to the input element
	const inputRef = useRef<HTMLInputElement>(null)

	// > Use the useSearch hook to get the search state
	const { query, setQuery, viewState, setViewState, isSearchLoading, results, selectedIndex, setSelectedIndex, error: searchError } = useSearch()

	// > Use the useAIChat hook to get the AI chat state
	const { response, question, isLoading: isAILoading, error: aiError, sources, handleBack, generateAIResponse } = useAIChat({ query, viewState, setViewState })

	// > Define a function to submit the chat query (i.e. when a user presses Enter or clicks the submit button)
	function submitChatQuery() {
		if (viewState === "chat" && query.trim() !== "") {
			generateAIResponse(query)
		}
	}

	// > Define a function to handle the result selection (i.e. when a user clicks or otherwise selects a search result)
	function onResultSelect(index: number) {
		// >> If the index is the last item (i.e. the "Ask AI" option), ...
		if (index === results.length) {
			// >>> Switch to the chat view state (i.e. the Ask AI UI)
			setViewState("chat")
			// >>> If the query is not empty, generate an AI response for the query automatically
			if (query.trim() !== "") generateAIResponse(query)
		}
		// >> Otherwise, if the index is a valid result index, ...
		if (index >= 0 && index < results.length) {
			// >>> Log the selected result
			console.log("Selected:", results[index])
		}
	}

	// > Use the useKeyboardNavigation hook to handle keyboard navigation
	const { handleKeyDown } = useKeyboardNavigation({ selectedIndex, setSelectedIndex, resultsLength: results.length, viewState, onResultSelect: onResultSelect, handleManualSubmit: submitChatQuery })

	// > Use the useKeyboardShortcut hook to handle keyboard shortcuts
	useKeyboardShortcut({ key: "k", callbackFn: () => setOpen((open) => !open) })

	// > Use the useFocusOnInputOpen hook to focus on the input when the search dialog is opened
	useFocusOnInputOpen(open, inputRef)

	// > Define the search results state
	const searchResultsState = { results: results, selectedIndex: selectedIndex, error: searchError, isLoading: isSearchLoading, onResultSelect: onResultSelect, query: query, onAskAI: () => setViewState("chat") }

	// > Define the AI chat response state
	const aiChatResponseProps = {
		response: response,
		question: question,
		isLoading: isAILoading,
		error: aiError,
		sources: sources.map((source) => ({ id: crypto.createHash("sha256").update(source).digest("base64"), title: source })),
	}

	// > Return the JSX for the DocumentationSearch component
	return (
		<>
			<SearchTriggerButton setOpen={setOpen} />
			<SearchModal
				open={open}
				setOpen={setOpen}
				inputRef={inputRef}
				viewState={viewState}
				query={query}
				setQuery={setQuery}
				handleBack={handleBack}
				handleKeyDown={handleKeyDown}
				handleManualSubmit={submitChatQuery}
				searchProps={searchResultsState}
				aiProps={aiChatResponseProps}
			/>
		</>
	)
}
