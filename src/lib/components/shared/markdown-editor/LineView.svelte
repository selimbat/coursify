<script lang="ts">
	import type { ParsedLine } from './parse';
	import { headingClasses, parseLine } from './parse';

	interface Props {
		line: string;
		index: number;
		onFocus: (index: number) => void;
		onToggleCheckbox: (index: number) => void;
		onActivateKey: (index: number, event: KeyboardEvent) => void;
	}

	let { line, index, onFocus, onToggleCheckbox, onActivateKey }: Props = $props();

	const parsed: ParsedLine = $derived(parseLine(line));
</script>

{#if parsed.type === 'empty'}
	<div
		class="h-6 w-full"
		role="button"
		tabindex="-1"
		aria-label="Ligne vide — cliquer pour éditer"
		onclick={() => onFocus(index)}
		onkeydown={(event) => onActivateKey(index, event)}
	></div>
{:else if parsed.type === 'checkbox'}
	<div class="flex items-start gap-2 py-0.5">
		<input
			type="checkbox"
			checked={parsed.checked}
			onchange={() => onToggleCheckbox(index)}
			onclick={(event) => event.stopPropagation()}
			class="mt-1 size-4 shrink-0 cursor-pointer accent-muted"
		/>
		<button
			type="button"
			class={`flex-1 cursor-text text-left text-sm leading-6 ${parsed.checked ? 'text-muted-foreground line-through' : ''}`}
			onclick={() => onFocus(index)}
		>
			{#if parsed.html}
				{@html parsed.html}
			{:else}
				<span class="block h-6"></span>
			{/if}
		</button>
	</div>
{:else if parsed.type === 'heading'}
	<button
		type="button"
		class={`${headingClasses[parsed.level] ?? headingClasses[6]} block w-full cursor-text text-left`}
		onclick={() => onFocus(index)}
	>
		{@html parsed.html}
	</button>
{:else if parsed.type === 'listItem'}
	<button
		type="button"
		class="flex w-full cursor-text items-start gap-2 py-0.5 text-left"
		onclick={() => onFocus(index)}
	>
		<span class="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/60"></span>
		<span class="flex-1 text-sm leading-6">{@html parsed.html}</span>
	</button>
{:else}
	<button
		type="button"
		class="block w-full cursor-text text-left text-sm leading-6"
		onclick={() => onFocus(index)}
	>
		{@html parsed.html}
	</button>
{/if}
