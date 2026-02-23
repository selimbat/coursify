<script lang="ts">
	import { untrack, tick, onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { ArrowLeft, Calendar, BookTemplate, Save, Trash2, CloudOff } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import MarkdownEditor from '$lib/components/shared/MarkdownEditor.svelte';
	import type { ActiveUser } from '$lib/services/user.service.svelte';
	import {
		getPendingChange,
		persistPendingChange,
		clearPendingChange
	} from '$lib/services/pending-changes.service';
	import { offlineService } from '$lib/services/offline.service.svelte';

	type ListStatus = 'ongoing' | 'done';
	const statusConfig: Record<ListStatus, { label: string; class: string }> = {
		ongoing: {
			label: 'En cours',
			class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
		},
		done: {
			label: 'Faite',
			class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
		}
	};

	interface List {
		id: string;
		title: string;
		status: ListStatus;
		markdown: string;
		is_template: boolean;
		created_at: Date | string | null;
		updated_at: Date | string | null;
		last_modified_by: ActiveUser | null;
	}

	let { list }: { list: List } = $props();

	let submitRef: (() => void) | undefined;

	// ---------------------------------------------------------------------------
	// Initial state — prefer localStorage pending change over the server value
	// so the editor shows the right content immediately (no flash).
	// ---------------------------------------------------------------------------
	function resolveInitialMarkdown(): { markdown: string; hasRestoredChanges: boolean } {
		if (typeof localStorage === 'undefined') {
			return { markdown: list.markdown, hasRestoredChanges: false };
		}
		const pending = getPendingChange(list.id);
		if (pending && pending.markdown !== list.markdown) {
			return { markdown: pending.markdown, hasRestoredChanges: true };
		}
		return { markdown: list.markdown, hasRestoredChanges: false };
	}

	const initialState = untrack(() => resolveInitialMarkdown());

	let title = $state(untrack(() => list.title));
	let status = $state<ListStatus>(untrack(() => list.status));
	let markdown = $state(initialState.markdown);
	let isSavingMarkdown = $state(false);
	let markdownFormRef: HTMLFormElement | null = $state(null);
	/** Briefly true after a successful save — drives the green confirmation flash. */
	let justSynced = $state(false);

	// Only the title triggers the manual save button; status submits immediately.
	let isDirty = $derived(title !== list.title);
	let isMarkdownDirty = $derived(markdown !== list.markdown);

	// ---------------------------------------------------------------------------
	// Offline / pending-changes logic (Story 17)
	// ---------------------------------------------------------------------------

	// Reactive online flag — read from the shared service (no local listeners).
	let isOnline = $derived(offlineService.isOnline);

	// True when we loaded a pending change from localStorage on init.
	// Reset to false after a successful sync.
	let hasRestoredChanges = $state(initialState.hasRestoredChanges);

	// Show the pending indicator when:
	//  - we restored an unsynced change from localStorage, OR
	//  - we are currently offline and have unsaved edits.
	let hasPendingOfflineChanges = $derived(hasRestoredChanges || (!isOnline && isMarkdownDirty));

	onMount(() => {
		// When connectivity is restored, submit this list's form so the enhance
		// callback updates local reactive state (isMarkdownDirty, hasRestoredChanges).
		// Global sync of all pending lists is handled by offlineService itself.
		const unsubOnline = offlineService.onOnline(() => {
			if ((isMarkdownDirty || hasRestoredChanges) && markdownFormRef) {
				markdownFormRef.requestSubmit();
			}
		});

		return unsubOnline;
	});

	// When offline and the markdown has been edited, persist locally so changes
	// survive a page refresh (prerequisite for Story 18 full IndexedDB impl).
	// Note: only writes to localStorage — no Svelte state is mutated here.
	$effect(() => {
		if (!isOnline && markdown !== list.markdown) {
			try {
				const change = { markdown, savedAt: Date.now() };
				localStorage.setItem(`coursify:pending:${list.id}`, JSON.stringify(change));
			} catch {
				// local persistence is best-effort
			}
		}
	});

	function handleMarkdownKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 's' && isMarkdownDirty) {
			e.preventDefault();
			markdownFormRef?.requestSubmit();
		}
	}

	let confirmDelete = $state(false);

	async function setStatus(opt: ListStatus) {
		status = opt;
		await tick(); // let the hidden input update before submitting
		submitRef?.();
	}

	function formatDate(date: Date | string | null): string {
		if (!date) return '';
		return new Intl.DateTimeFormat('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(date));
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
	<div class="flex items-start gap-4">
		<!-- Back button -->
		<Button href="/" variant="outline" size="icon" class="mt-1 shrink-0" aria-label="Retour">
			<ArrowLeft />
		</Button>

		<!-- Edit form: title + status -->
		<form
			{@attach (node) => {
				submitRef = () => node.requestSubmit();
				return () => {
					submitRef = undefined;
				};
			}}
			method="POST"
			action="?/update"
			use:enhance={() => {
				return async ({ update }) => {
					// update without resetting the form so the bound inputs keep their values
					await update({ reset: false });
				};
			}}
			class="min-w-0 flex-1"
		>
			<input type="hidden" name="status" value={status} />

			<!-- Status pills / template badge -->
			<div class="flex flex-wrap items-center gap-1.5">
				{#if list.is_template}
					<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
						<BookTemplate class="size-3.5" />
						Modèle de liste
					</span>
				{:else}
					{#each Object.entries(statusConfig) as [opt, values] (opt)}
						<Button
							type="button"
							variant={status === opt ? 'secondary' : 'ghost'}
							size="sm"
							onclick={() => setStatus(opt as ListStatus)}
							disabled={!isOnline}
							class={`h-7 rounded-full px-3 text-xs ${status === opt ? values.class : ''}`}
						>
							{values.label}
						</Button>
					{/each}

					{#if list.created_at}
						<span class="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
							<Calendar class="size-3" />
							{formatDate(list.created_at)}
						</span>
					{/if}
				{/if}
				<!-- Delete button -->
				<Button
					type="button"
					variant="ghost"
					size="icon"
					class="ml-auto shrink-0 text-muted-foreground hover:text-destructive"
					aria-label={list.is_template ? 'Supprimer le modèle' : 'Supprimer la liste'}
					onclick={() => (confirmDelete = !confirmDelete)}
					disabled={!isOnline}
				>
					<Trash2 class="size-4" />
				</Button>
			</div>

			<!-- Inline title input + contextual save button -->
			<div class="mt-1.5 flex items-center gap-3">
				<input
					name="title"
					type="text"
					bind:value={title}
					placeholder={list.is_template ? 'Modèle' : 'Sans titre'}
					disabled={!isOnline}
					class="min-w-0 flex-1 border-b border-transparent bg-transparent py-0.5 text-2xl font-bold tracking-tight transition-colors outline-none placeholder:text-muted-foreground/50 hover:border-border focus:border-foreground"
				/>
				{#if isDirty}
					<div transition:fly={{ x: 8, duration: 150 }}>
						<Button type="submit" size="sm" class="shrink-0" disabled={!isOnline}>
							<Save />
							<span class="hidden sm:inline"> Sauvegarder </span>
						</Button>
					</div>
				{/if}
			</div>
		</form>
	</div>

	<!-- Inline delete confirmation -->
	{#if confirmDelete}
		<div
			transition:fly={{ y: -6, duration: 180 }}
			class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
		>
			<p class="text-sm text-destructive">
				{list.is_template
					? 'Supprimer ce modèle définitivement ?'
					: 'Supprimer cette liste définitivement ?'}
			</p>
			<div class="flex shrink-0 items-center gap-2">
				<Button type="button" variant="ghost" size="sm" onclick={() => (confirmDelete = false)}>
					Annuler
				</Button>
				<form method="POST" action="?/delete" use:enhance>
					<Button type="submit" variant="destructive" size="sm" disabled={!isOnline}>
						Supprimer
					</Button>
				</form>
			</div>
		</div>
	{/if}

	<hr class="my-8 border-border" />

	<!-- Markdown editor (Story 10) -->
	<form
		{@attach (node) => {
			markdownFormRef = node;
			return () => {
				markdownFormRef = null;
			};
		}}
		method="POST"
		action="?/saveMarkdown"
		use:enhance={() => {
			isSavingMarkdown = true;
			return async ({ update, result }) => {
				await update({ reset: false });
				isSavingMarkdown = false;
				if (result.type === 'success') {
					clearPendingChange(list.id);
					hasRestoredChanges = false;
					justSynced = true;
					setTimeout(() => (justSynced = false), 3000);
				}
			};
		}}
	>
		<MarkdownEditor
			name="markdown"
			bind:value={markdown}
			onkeydown={handleMarkdownKeydown}
			placeholder="Commencez à écrire votre liste en Markdown…

- [ ] Article 1
- [ ] Article 2"
			class="min-h-48"
		/>

		{#if hasPendingOfflineChanges && !isMarkdownDirty}
			<div
				transition:fly={{ y: 6, duration: 150 }}
				class="mt-3 flex items-center gap-2 text-xs text-muted-foreground"
			>
				<CloudOff class="size-3.5 shrink-0" />
				<span>Modifications en attente de synchronisation</span>
			</div>
		{/if}

		{#if justSynced}
			<div
				transition:fly={{ y: 6, duration: 200 }}
				class="mt-3 flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400"
			>
				<svg class="size-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
					<path
						d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"
					/>
				</svg>
				<span>Synchronisé avec succès</span>
			</div>
		{/if}

		{#if isMarkdownDirty}
			<div
				transition:fly={{ y: 6, duration: 150 }}
				class="mt-3 flex items-center justify-between gap-3"
			>
				<p class="text-xs text-muted-foreground">
					{#if !isOnline}
						<span class="inline-flex items-center gap-1.5">
							<CloudOff class="size-3.5 shrink-0" />
							Modifications en attente — synchronisation à la reconnexion
						</span>
					{:else}
						Modifications non sauvegardées
					{/if}
				</p>
				<div class="flex items-center gap-2">
					{#if isOnline}
						<kbd
							class="hidden rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline"
							>Ctrl+S</kbd
						>
						<Button type="submit" size="sm" disabled={isSavingMarkdown}>
							<Save />
							{isSavingMarkdown ? 'Sauvegarde…' : 'Sauvegarder'}
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	</form>
</div>
