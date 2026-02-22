# UI Design

When editing UI, always use the best practices in SvelteKit apps and UI components from the [shadcn](https://www.shadcn-svelte.com/docs/components) component library. Always design as if you were an experienced web designer who only accepts designs that follow extremely severe best practices.
- You should never write style in Svelte components!
- If any shadcn components you require aren't installed, you are allowed to install them.
- You may use classes but only ones relative to positioning and layout, not theming.
- If CSS classes are needed, you must always use tailwindcss.
- The design has to be coherent throughout the app.
- Always have consistent spacing in the page.
- Always have support for different sized devices in mind when designing UI.
- Don't change any logic in the page unless otherwise specified.

## Workflow when designing

- Reading the docs and requirements
- Reading the existing backend and data logic if it exists
- Building a first draft of the UI
- Checking with playwright and the `browser_navigate` tool that the UI is as expected
- Go through a second pass on the UI design, improving what looked wrong in the previous step. You can suggest changes that weren't in the specs but add value to the UI, like small animations, effects...
- Finally, give a short summary of everything that was done.

## Available MCP Tools:

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:


### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
