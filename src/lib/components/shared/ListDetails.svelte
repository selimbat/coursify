<script lang="ts">
	import { ArrowLeft, Calendar, BookTemplate } from '@lucide/svelte';

	type ListStatus = 'ongoing' | 'pending' | 'done';

	interface List {
		id: string;
		title: string;
		status: ListStatus;
		markdown: string;
		is_template: boolean;
		created_at: Date | string | null;
		updated_at: Date | string | null;
		last_modified_by: 'user_a' | 'user_b' | null;
	}

	let { list }: { list: List } = $props();

	const statusConfig: Record<ListStatus, { label: string; class: string }> = {
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
			month: 'long',
			year: 'numeric'
		}).format(new Date(date));
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
	<!-- Header -->
	<div class="mb-6 flex items-start gap-4">
		<a
			href="/"
			class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card transition-colors hover:bg-accent"
			aria-label="Retour"
		>
			<ArrowLeft class="size-4" />
		</a>

		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				{#if list.is_template}
					<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
						<BookTemplate class="size-3.5" />
						Modèle de liste
					</span>
				{:else}
					<span
						class="rounded-full px-2.5 py-1 text-xs font-medium {statusConfig[list.status]?.class}"
					>
						{statusConfig[list.status]?.label}
					</span>
					{#if list.created_at}
						<span class="flex items-center gap-1 text-xs text-muted-foreground">
							<Calendar class="size-3" />
							{formatDate(list.created_at)}
						</span>
					{/if}
				{/if}
			</div>

			<h1 class="mt-1 text-xl leading-snug font-bold tracking-tight">
				{list.title || (list.is_template ? 'Modèle' : 'Sans titre')}
			</h1>
		</div>
	</div>

	<!-- Content placeholder (Stories 10–12 will fill this) -->
	<div class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
		Le contenu Markdown sera disponible prochainement.
	</div>
</div>
