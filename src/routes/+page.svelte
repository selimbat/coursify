<script lang="ts">
	import { ShoppingCart, BookTemplate, Calendar, Plus } from '@lucide/svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();
	const statusConfig: Record<string, { label: string; class: string }> = {
		ongoing: {
			label: 'En cours',
			class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
		},
		pending: {
			label: 'En attente',
			class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
		},
		done: {
			label: 'Faite',
			class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
		}
	};

	function formatDate(date: Date | string | null): string {
		if (!date) return '';
		return new Intl.DateTimeFormat('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold tracking-tight">Mes listes</h1>
		<form method="POST" action="?/createList" use:enhance>
			<button
				type="submit"
				class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:scale-95"
			>
				<Plus class="size-4" />
				<span class="hidden sm:inline">Nouvelle liste</span>
			</button>
		</form>
	</div>

	<div class="flex flex-col gap-3">
		<!-- Template list (pinned at top, no date) -->
		{#if data.templates.length > 0}
			{#each data.templates as template (template.id)}
				<a
					href="/lists/{template.id}"
					class="group flex items-center gap-4 rounded-xl border bg-card px-4 py-4 transition-colors hover:bg-accent"
				>
					<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
						<BookTemplate class="size-5 text-muted-foreground" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate leading-tight font-semibold">{template.title || 'Modèle'}</p>
						<p class="mt-0.5 text-xs text-muted-foreground">Modèle de liste</p>
					</div>
					<span
						class="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground"
					>
						Modèle
					</span>
				</a>
			{/each}
		{/if}
		{#if data.lists.length > 0}
			<div class="flex items-center gap-3 py-1">
				<div class="h-px flex-1 bg-border"></div>
				<span class="text-xs text-muted-foreground">Listes de courses</span>
				<div class="h-px flex-1 bg-border"></div>
			</div>
		{/if}

		<!-- Regular lists sorted by created_at desc -->
		{#if data.lists.length === 0}
			<div
				class="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center"
			>
				<ShoppingCart class="size-10 text-muted-foreground/40" />
				<p class="text-sm text-muted-foreground">Aucune liste de courses pour l'instant.</p>
			</div>
		{:else}
			{#each data.lists as list (list.id)}
				<a
					href="/lists/{list.id}"
					class="group flex items-center gap-4 rounded-xl border bg-card px-4 py-4 transition-colors hover:bg-accent"
				>
					<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
						<ShoppingCart class="size-5 text-muted-foreground" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate leading-tight font-semibold">{list.title || 'Sans titre'}</p>
						{#if list.created_at}
							<p class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
								<Calendar class="size-3 shrink-0" />
								{formatDate(list.created_at)}
							</p>
						{/if}
					</div>
					{#if list.status}
						<span
							class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium {statusConfig[
								list.status
							]?.class ?? ''}"
						>
							{statusConfig[list.status]?.label ?? list.status}
						</span>
					{/if}
				</a>
			{/each}
		{/if}
	</div>
</div>
