<script lang="ts">
	import LineView from './LineView.svelte';
	import {
		createEditorController,
		getCheckboxLabel,
		isCheckboxWithLabel,
		isChecked
	} from './controller';

	interface Props {
		value?: string;
		name?: string;
		placeholder?: string;
		class?: string;
		onkeydown?: (event: KeyboardEvent) => void;
	}

	let {
		value = $bindable(''),
		name,
		placeholder = 'Commencez à écrire…',
		class: className = '',
		onkeydown: externalKeydown
	}: Props = $props();

	let lines = $state<string[]>(value ? value.split('\n') : ['']);
	let activeIndex = $state<number | null>(null);
	let activeLabelMode = $state(false);
	const inputRefs: Record<number, HTMLTextAreaElement | null> = {};

	const controller = createEditorController({
		getLines: () => lines,
		setLines: (next) => (lines = next),
		commitLines: () => (value = lines.join('\n')),
		getActiveIndex: () => activeIndex,
		setActiveIndex: (index) => (activeIndex = index),
		getActiveLabelMode: () => activeLabelMode,
		setActiveLabelMode: (mode) => (activeLabelMode = mode),
		inputRefs
	});

	const {
		registerTouchListeners,
		attachRef,
		focusLine,
		handleSelectionChange,
		handleInput,
		handleKeydown,
		handleBlur,
		toggleCheckbox,
		activateOnKey
	} = controller;

	$effect(() => registerTouchListeners());
</script>

<div
	data-markdown-editor
	class={`relative min-h-32 cursor-text rounded-md border border-input bg-background px-3 py-2 focus:outline-none ${className}`}
	role="textbox"
	tabindex="-1"
	aria-multiline="true"
	aria-label="Éditeur Markdown"
	onclick={(e) => {
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
	{#if name}
		<input type="hidden" {name} value={lines.join('\n')} />
	{/if}

	{#if activeIndex === null && lines.every((l) => !l.trim())}
		<p class="pointer-events-none absolute top-2 left-3 text-sm text-muted-foreground select-none">
			{placeholder}
		</p>
	{/if}

	{#each lines as line, i (i)}
		{@const active = activeIndex === i}
		{@const showCheckbox = active && activeLabelMode && isCheckboxWithLabel(line)}
		<div class="relative">
			{#if showCheckbox}
				<input
					type="checkbox"
					checked={isChecked(line)}
					onchange={() => toggleCheckbox(i)}
					onclick={(e) => e.stopPropagation()}
					class="absolute top-1 left-0 z-10 size-4 cursor-pointer accent-foreground"
				/>
			{/if}

			<textarea
				{@attach attachRef(i)}
				value={showCheckbox ? getCheckboxLabel(line) : line}
				oninput={(event) => handleInput(i, event)}
				onkeydown={(event) => handleKeydown(i, event, externalKeydown)}
				onblur={handleBlur}
				onselectionchange={() => handleSelectionChange(i)}
				rows={1}
				autocapitalize="off"
				spellcheck={false}
				class={active
					? `absolute inset-0 z-10 resize-none overflow-hidden border-none bg-transparent font-mono text-sm leading-6 outline-none${showCheckbox ? ' left-6' : ''}`
					: 'pointer-events-none absolute inset-0 -z-10 resize-none overflow-hidden opacity-0'}
			></textarea>

			<div class={active ? 'pointer-events-none invisible select-none' : ''}>
				<LineView
					{line}
					index={i}
					onFocus={focusLine}
					onToggleCheckbox={toggleCheckbox}
					onActivateKey={activateOnKey}
				/>
			</div>
		</div>
	{/each}

	<div
		class="h-10 w-full"
		role="button"
		tabindex="-1"
		aria-label="Cliquer pour éditer"
		onclick={() => focusLine(lines.length - 1)}
		onkeydown={(e) => activateOnKey(lines.length - 1, e)}
	></div>
</div>
