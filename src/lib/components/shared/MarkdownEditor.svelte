<script lang="ts">
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

	// ---------------------------------------------------------------------------
	// Mobile touch tracking — used by the spacebar-drag cursor handler below.
	// ---------------------------------------------------------------------------
	let touchActive = false;
	// Position of the cursor as of the last selectionchange event, for direction
	// detection. Resets to -1 whenever we change the active line.
	let prevCursorPos = -1;

	$effect(() => {
		const markTouchStart = () => {
			touchActive = true;
		};
		const markTouchEnd = () => {
			touchActive = false;
		};
		document.addEventListener('touchstart', markTouchStart, { passive: true });
		document.addEventListener('touchend', markTouchEnd, { passive: true });
		document.addEventListener('touchcancel', markTouchEnd, { passive: true });
		return () => {
			document.removeEventListener('touchstart', markTouchStart);
			document.removeEventListener('touchend', markTouchEnd);
			document.removeEventListener('touchcancel', markTouchEnd);
		};
	});

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
	// Focus management — SYNCHRONOUS (no tick/await) so mobile browsers honour
	// the .focus() call within the originating user-gesture handler.
	//
	// Strategy: textareas are always present in the DOM (just invisible via CSS
	// when inactive), so inputRefs[index] is always populated and we can focus
	// immediately without waiting for a DOM update.
	// ---------------------------------------------------------------------------
	function focusLine(index: number, cursorPos?: number) {
		activeIndex = index;
		prevCursorPos = -1;
		const el = inputRefs[index];
		if (!el) return;
		// autoResize before focus so the textarea has the right height the moment
		// it becomes visible (avoids a one-frame height flash).
		autoResize(el);
		el.focus();
		const pos = cursorPos ?? el.value.length;
		el.selectionStart = el.selectionEnd = pos;
	}

	// ---------------------------------------------------------------------------
	// Spacebar-drag / cursor-drag cross-line navigation (mobile only).
	//
	// On iOS/Android, holding the spacebar and dragging moves the cursor inside
	// a textarea. When the cursor reaches position 0 coming from position 1 (i.e.
	// the user is still dragging backward), we jump to the end of the previous
	// line. Symmetrically at the end of the line for the next line.
	// The touchActive guard prevents this from firing on physical-keyboard use.
	// ---------------------------------------------------------------------------
	function handleSelectionChange(i: number) {
		if (!touchActive || activeIndex !== i) return;
		const el = inputRefs[i];
		if (!el || document.activeElement !== el) return;

		const pos = el.selectionStart ?? 0;
		const prev = prevCursorPos;
		prevCursorPos = pos;

		if (prev < 0) return; // Ignore the initial cursor placement on focus.

		// Dragged backward past the start of the line → jump to end of previous.
		if (pos === 0 && prev <= 1 && i > 0) {
			prevCursorPos = -1;
			focusLine(i - 1, lines[i - 1].length);
			return;
		}
		// Dragged forward past the end of the line → jump to start of next.
		const lineLen = el.value.length;
		if (pos === lineLen && prev >= lineLen - 1 && i < lines.length - 1) {
			prevCursorPos = -1;
			focusLine(i + 1, 0);
		}
	}

	// ---------------------------------------------------------------------------
	// Textarea event handlers
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

		if (e.key === 'Enter') {
			e.preventDefault();
			const cursor = el.selectionStart ?? el.value.length;
			const before = el.value.slice(0, cursor);
			const after = el.value.slice(cursor);
			// An empty unchecked checkbox — escape the list and give a plain empty line.
			const isEmptyCheckbox = /^[-*]\s+\[ \]\s*$/.test(el.value.trim());
			if (isEmptyCheckbox) {
				lines[i] = '';
				commit();
				focusLine(i, 0);
				return;
			}
			// If the current line is a checkbox, continue with a new unchecked one.
			const isCheckbox = /^[-*]\s+\[[xX ]\]/.test(el.value.trim());
			lines[i] = before;
			lines.splice(i + 1, 0, isCheckbox && cursor > 5 ? `- [ ] ${after}` : after);
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
			// Synchronous focus — the prev textarea is always in the DOM.
			activeIndex = i - 1;
			const prev = inputRefs[i - 1];
			if (prev) {
				autoResize(prev);
				prev.focus();
				prev.selectionStart = prev.selectionEnd = prevLen;
			}
		} else if (e.altKey && e.key === 'ArrowUp' && i > 0) {
			e.preventDefault();
			// Swap the current line with the one above it.
			const cursor = el.selectionStart;
			[lines[i - 1], lines[i]] = [lines[i], lines[i - 1]];
			commit();
			focusLine(i - 1, cursor);
		} else if (e.altKey && e.key === 'ArrowDown' && i < lines.length - 1) {
			e.preventDefault();
			// Swap the current line with the one below it.
			const cursor = el.selectionStart;
			[lines[i], lines[i + 1]] = [lines[i + 1], lines[i]];
			commit();
			focusLine(i + 1, cursor);
		} else if (e.key === 'ArrowUp' && i > 0) {
			e.preventDefault();
			// Preserve the cursor column in the line above (clamped to its length).
			focusLine(i - 1, el.selectionStart);
		} else if (e.key === 'ArrowDown' && i < lines.length - 1) {
			e.preventDefault();
			// Preserve the cursor column in the line below (clamped to its length).
			focusLine(i + 1, el.selectionStart);
		} else if (e.key === 'ArrowLeft' && el.selectionStart === 0 && el.selectionEnd === 0 && i > 0) {
			e.preventDefault();
			// At the very start of a line → jump to the end of the previous line.
			focusLine(i - 1, lines[i - 1].length);
		} else if (
			e.key === 'ArrowRight' &&
			el.selectionStart === el.value.length &&
			el.selectionEnd === el.value.length &&
			i < lines.length - 1
		) {
			e.preventDefault();
			// At the very end of a line → jump to the start of the next line.
			focusLine(i + 1, 0);
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
    - The active line renders as a raw-markdown monospace textarea.
    - All other lines render as styled HTML (heading, checkbox, list item, text).
    - IMPORTANT: every line's textarea is always present in the DOM (just hidden
      via CSS when inactive). This lets focusLine() call .focus() synchronously
      within the originating user-gesture handler — required for mobile browsers
      to honour the programmatic focus and keep the virtual keyboard open.
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

	<!--
	  Line loop.
	  Each line is a `relative` wrapper containing:
	    1. A textarea that is ALWAYS in the DOM.
	       - Active   → normal block flow, fully visible, monospace.
	       - Inactive → absolute overlay, opacity-0, pointer-events-none.
	         Still focusable via JS so focusLine() works synchronously.
	    2. The rendered HTML view, shown only when the line is inactive.
	       It provides the layout height for inactive lines (the textarea
	       is absolute and therefore out of normal flow when inactive).
	-->
	{#each lines as line, i (i)}
		<div class="relative">
			<!-- Textarea: always present. Visible ↔ invisible via class swap. -->
			<textarea
				{@attach attachRef(i)}
				value={line}
				oninput={(e) => handleInput(i, e)}
				onkeydown={(e) => handleKeydown(i, e)}
				onblur={(e) => handleBlur(i, e)}
				onselectionchange={() => handleSelectionChange(i)}
				rows={1}
				autocapitalize="off"
				spellcheck={false}
				class={activeIndex === i
					? '-mx-1 block w-full resize-none overflow-hidden rounded-sm border-none bg-transparent px-1 font-mono text-sm leading-6 outline-none'
					: 'pointer-events-none absolute inset-0 -z-10 resize-none overflow-hidden opacity-0'}
			></textarea>

			<!-- Rendered view: only when line is NOT active. -->
			{#if activeIndex !== i}
				{@const parsed = parseLine(line)}

				{#if parsed.type === 'empty'}
					<!-- Empty lines get a generous tap target so they're easy to hit on mobile. -->
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
							onclick={() => focusLine(i)}
						>
							{#if parsed.html}
								{@html parsed.html}
							{:else}
								<!-- Empty checkbox label — still a full-height tap target. -->
								<span class="block h-6"></span>
							{/if}
						</button>
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
		</div>
	{/each}

	<!-- Bottom padding zone: tapping the empty space below all lines focuses
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
