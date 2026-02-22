<script lang="ts">
	import { tick } from 'svelte';
	import { marked } from 'marked';

	interface Props {
		value?: string;
		name?: string;
		placeholder?: string;
		class?: string;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		value = $bindable(''),
		name,
		placeholder = 'Commencez à écrire…',
		class: className = '',
		onkeydown: externalKeydown
	}: Props = $props();

	// Lines are the source of truth; value is derived and kept in sync.
	let lines = $state<string[]>(value ? value.split('\n') : ['']);
	let activeIndex = $state<number | null>(null);
	let inputRefs: Record<number, HTMLTextAreaElement | null> = {};

	function attachRef(i: number) {
		return (node: HTMLTextAreaElement) => {
			inputRefs[i] = node;
			return () => {
				inputRefs[i] = null;
			};
		};
	}

	function commit() {
		value = lines.join('\n');
	}

	function autoResize(el: HTMLTextAreaElement) {
		el.style.height = 'auto';
		el.style.height = el.scrollHeight + 'px';
	}

	// ---------------------------------------------------------------------------
	// Focus management
	// Sets activeIndex to bring a line into edit mode, then (after the DOM
	// updates via tick()) focuses the newly rendered textarea and places the
	// cursor. cursorPos defaults to end-of-line when omitted.
	// ---------------------------------------------------------------------------
	async function focusLine(index: number, cursorPos?: number) {
		activeIndex = index;
		await tick();
		const el = inputRefs[index];
		if (!el) return;
		autoResize(el);
		el.focus();
		const pos = cursorPos ?? el.value.length;
		el.selectionStart = el.selectionEnd = pos;
	}

	// ---------------------------------------------------------------------------
	// Textarea event handlers (active line only)
	// ---------------------------------------------------------------------------

	// Keep the line content and the textarea height in sync as the user types.
	function handleInput(i: number, e: Event) {
		const el = e.target as HTMLTextAreaElement;
		autoResize(el);
		lines[i] = el.value;
		commit();
	}

	// Handles special keys while a line is in edit mode:
	//   Enter (no shift) — splits the line at the cursor into two lines.
	//   Backspace at col 0 — merges this line into the end of the previous one.
	//   ArrowUp — moves focus to the line above, keeping the cursor column.
	//   ArrowDown — moves focus to the line below, keeping the cursor column.
	// The externalKeydown prop is forwarded first so the parent can intercept
	// (e.g. Ctrl+S) and call e.preventDefault() before our handlers run.
	function handleKeydown(i: number, e: KeyboardEvent) {
		externalKeydown?.(e);
		if (e.defaultPrevented) return;

		const el = inputRefs[i];
		if (!el) return;

		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			const cursor = el.selectionStart ?? el.value.length;
			const before = el.value.slice(0, cursor);
			const after = el.value.slice(cursor);
			// If the current line is a checkbox, continue with a new unchecked one.
			const isCheckbox = /^[-*]\s+\[[xX ]\]/.test(el.value.trim());
			lines[i] = before;
			lines.splice(i + 1, 0, isCheckbox ? `- [ ] ${after}` : after);
			commit();
			focusLine(i + 1, isCheckbox ? 6 : 0);
		} else if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0 && i > 0) {
			e.preventDefault();
			// Remember the original length of the previous line so we can restore
			// the cursor at the junction point after the merge.
			const prevLen = lines[i - 1].length;
			lines[i - 1] = lines[i - 1] + lines[i];
			lines.splice(i, 1);
			commit();
			activeIndex = i - 1;
			tick().then(() => {
				const prev = inputRefs[i - 1];
				if (prev) {
					autoResize(prev);
					prev.focus();
					prev.selectionStart = prev.selectionEnd = prevLen;
				}
			});
		} else if (e.key === 'ArrowUp' && i > 0) {
			e.preventDefault();
			// Preserve the cursor column in the line above (clamped to its length).
			focusLine(i - 1, el.selectionStart);
		} else if (e.key === 'ArrowDown' && i < lines.length - 1) {
			e.preventDefault();
			// Preserve the cursor column in the line below (clamped to its length).
			focusLine(i + 1, el.selectionStart);
		}
	}

	// Exit edit mode when focus leaves the editor entirely. If focus moves to
	// another element *inside* the editor container (e.g. a checkbox), we keep
	// the activeIndex so the transition feels seamless.
	function handleBlur(i: number, e: FocusEvent) {
		const related = e.relatedTarget as HTMLElement | null;
		if (!related || !related.closest('[data-markdown-editor]')) {
			activeIndex = null;
		}
	}

	// ---------------------------------------------------------------------------
	// Checkbox toggle (rendered view — no edit mode required)
	// Mutates the raw markdown string for line i in-place, then commits.
	// ---------------------------------------------------------------------------
	function toggleCheckbox(i: number) {
		const line = lines[i];
		if (/- \[ \]/.test(line)) {
			lines[i] = line.replace('- [ ]', '- [x]');
		} else if (/- \[[xX]\]/.test(line)) {
			lines[i] = line.replace(/- \[[xX]\]/, '- [ ]');
		}
		commit();
	}

	// Keyboard handler for rendered (non-textarea) elements so they are
	// accessible without a mouse — Enter or Space enters edit mode.
	function activateOnKey(i: number, e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			focusLine(i);
		}
	}

	// ---------------------------------------------------------------------------
	// Line parsing — converts a raw markdown string into a typed descriptor.
	// The template then switches on `type` to render the appropriate element.
	// Patterns are tested in priority order: checkbox > heading > list > text.
	// Only inline markdown (bold, italic, code, links) is processed via
	// marked.parseInline — block-level rendering is handled structurally above.
	// ---------------------------------------------------------------------------

	type ParsedLine =
		| { type: 'checkbox'; checked: boolean; html: string }
		| { type: 'heading'; level: number; html: string }
		| { type: 'listItem'; html: string }
		| { type: 'empty' }
		| { type: 'text'; html: string };

	function parseLine(line: string): ParsedLine {
		const trimmed = line.trim();
		if (!trimmed) return { type: 'empty' };

		// - [ ] unchecked  /  - [x] checked
		const cbMatch = trimmed.match(/^[-*]\s+\[([xX ])\]\s*(.*)$/);
		if (cbMatch) {
			return {
				type: 'checkbox',
				checked: cbMatch[1].toLowerCase() === 'x',
				html: marked.parseInline(cbMatch[2]) as string
			};
		}

		// ## Heading  (levels 1–6)
		const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
		if (hMatch) {
			return {
				type: 'heading',
				level: hMatch[1].length,
				html: marked.parseInline(hMatch[2]) as string
			};
		}

		// - plain list item (no checkbox)
		const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
		if (listMatch) {
			return { type: 'listItem', html: marked.parseInline(listMatch[1]) as string };
		}

		// Everything else: render as inline markdown paragraph
		return { type: 'text', html: marked.parseInline(trimmed) as string };
	}

	// Tailwind classes for each heading level h1–h6.
	const headingClass: Record<number, string> = {
		1: 'text-2xl font-bold tracking-tight mt-5 mb-1',
		2: 'text-xl font-semibold tracking-tight mt-4 mb-0.5',
		3: 'text-lg font-semibold mt-3',
		4: 'text-base font-semibold mt-2',
		5: 'text-sm font-semibold mt-2',
		6: 'text-xs font-semibold mt-2'
	};
</script>

<!--
  Typora-style block editor:
    - The active line (activeIndex) renders as a raw-markdown monospace textarea.
    - All other lines render as styled HTML (heading, checkbox, list item, text).
    - Clicking / pressing Enter on the container itself (not a child element)
      focuses the last line so the editor feels like a contiguous text area.
-->
<div
	data-markdown-editor
	class={`relative min-h-32 cursor-text rounded-md border border-input bg-background px-3 py-2 focus:outline-none ${className}`}
	role="textbox"
	tabindex="-1"
	aria-multiline="true"
	aria-label="Éditeur Markdown"
	onclick={(e) => {
		// Only trigger when clicking the container backdrop, not a child line.
		if ((e.target as HTMLElement).hasAttribute('data-markdown-editor')) {
			focusLine(lines.length - 1);
		}
	}}
	onkeydown={(e) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).hasAttribute('data-markdown-editor')) {
			focusLine(lines.length - 1);
		}
	}}
>
	<!-- Hidden input carries the full markdown string for SvelteKit form actions. -->
	{#if name}
		<input type="hidden" {name} value={lines.join('\n')} />
	{/if}

	<!-- Placeholder: shown only when the editor is empty and unfocused. -->
	{#if activeIndex === null && lines.every((l) => !l.trim())}
		<p class="pointer-events-none absolute top-2 left-3 text-sm text-muted-foreground select-none">
			{placeholder}
		</p>
	{/if}

	<!-- Line loop — each line is either an editable textarea (active) or rendered HTML. -->
	{#each lines as line, i (i)}
		{#if activeIndex === i}
			<!-- Active line: raw markdown in a monospace auto-growing textarea. -->
			<div class="-mx-1 rounded-sm px-1">
				<textarea
					{@attach attachRef(i)}
					value={line}
					oninput={(e) => handleInput(i, e)}
					onkeydown={(e) => handleKeydown(i, e)}
					onblur={(e) => handleBlur(i, e)}
					rows={1}
					autocapitalize="off"
					spellcheck={false}
					class="block w-full resize-none overflow-hidden border-none bg-transparent font-mono text-sm leading-6 outline-none"
				></textarea>
			</div>
		{:else}
			<!-- Inactive line: parse and render according to markdown syntax. -->
			{@const parsed = parseLine(line)}

			{#if parsed.type === 'empty'}
				<div
					class="h-6 w-full"
					role="button"
					tabindex="-1"
					aria-label="Ligne vide — cliquer pour éditer"
					onclick={() => focusLine(i)}
					onkeydown={(e) => activateOnKey(i, e)}
				></div>
			{:else if parsed.type === 'checkbox'}
				<div class="flex items-start gap-2 py-0.5">
					<input
						type="checkbox"
						checked={parsed.checked}
						onchange={() => toggleCheckbox(i)}
						onclick={(e) => e.stopPropagation()}
						class="mt-1 size-4 shrink-0 cursor-pointer accent-foreground"
					/>
					<button
						type="button"
						class={`flex-1 cursor-text text-left text-sm leading-6 ${parsed.checked ? 'text-muted-foreground line-through' : ''}`}
						onclick={() => focusLine(i)}>{@html parsed.html}</button
					>
				</div>
			{:else if parsed.type === 'heading'}
				<button
					type="button"
					class={`${headingClass[parsed.level] ?? headingClass[6]} block w-full cursor-text text-left`}
					onclick={() => focusLine(i)}
				>
					{@html parsed.html}
				</button>
			{:else if parsed.type === 'listItem'}
				<button
					type="button"
					class="flex w-full cursor-text items-start gap-2 py-0.5 text-left"
					onclick={() => focusLine(i)}
				>
					<span class="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/60"></span>
					<span class="flex-1 text-sm leading-6">{@html parsed.html}</span>
				</button>
			{:else}
				<button
					type="button"
					class="block w-full cursor-text text-left text-sm leading-6"
					onclick={() => focusLine(i)}
				>
					{@html parsed.html}
				</button>
			{/if}
		{/if}
	{/each}

	<!-- Bottom padding zone: clicking the empty space below all lines focuses
	     the last line, making the editor feel like a full-height text area. -->
	<div
		class="h-10 w-full"
		role="button"
		tabindex="-1"
		aria-label="Cliquer pour éditer"
		onclick={() => focusLine(lines.length - 1)}
		onkeydown={(e) => activateOnKey(lines.length - 1, e)}
	></div>
</div>
