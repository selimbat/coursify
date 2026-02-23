<script lang="ts">
	import { ShoppingCart, BookTemplate, Calendar, Plus, Copy } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Separator } from '$lib/components/ui/separator';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { offlineService } from '$lib/services/offline.service.svelte';

	let { data } = $props();

	let activeTab = $state('lists');
	let createDialogOpen = $state(false);
	let createMode = $state<'blank' | 'template'>('blank');
	let selectedTemplateId = $state('');
	let includeUnchecked = $state(true);
	let isOnline = $derived(offlineService.isOnline);

	let visibleCount = $state(20);
	let visibleLists = $derived(data.lists.slice(0, visibleCount));
	let ongoingVisible = $derived(visibleLists.filter((l) => l.status === 'ongoing'));
	let doneVisible = $derived(visibleLists.filter((l) => l.status === 'done'));
	let hasMore = $derived(visibleCount < data.lists.length);

	function loadMore() {
		visibleCount += 10;
	}

	const statusConfig: Record<string, { label: string; class: string }> = {
		ongoing: {
			label: 'En cours',
			class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
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

	function handleNewListClick() {
		createMode = 'blank';
		includeUnchecked = true;
		createDialogOpen = true;
	}

	function handleFromTemplateClick() {
		createMode = 'template';
		includeUnchecked = true;
		selectedTemplateId = data.templates[0]?.id ?? '';
		createDialogOpen = true;
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold tracking-tight">Mes listes</h1>
		<div class="flex items-center gap-2">
			{#if activeTab === 'templates'}
				<!-- In templates tab: single button to create a new template -->
				<form method="POST" action="?/createTemplate" use:enhance>
					<Button type="submit" disabled={!isOnline}>
						<Plus class="size-4" />
						<span class="hidden sm:inline">Nouveau modèle</span>
					</Button>
				</form>
			{:else}
				{#if data.templates.length > 0}
					{#if data.templates.length === 1 && (data.lastDoneList?.uncheckedItems?.length ?? 0) === 0}
						<!-- Single template, no unchecked items: submit directly -->
						<form method="POST" action="?/createFromTemplate" use:enhance>
							<input type="hidden" name="templateId" value={data.templates[0].id} />
							<input type="hidden" name="includeUnchecked" value="false" />
							<Button type="submit" variant="outline" disabled={!isOnline}>
								<Copy class="size-4" />
								<span class="hidden sm:inline">Depuis un modèle</span>
							</Button>
						</form>
					{:else}
						<!-- Multiple templates or unchecked items: open dialog -->
						<Button
							type="button"
							variant="outline"
							onclick={handleFromTemplateClick}
							disabled={!isOnline}
						>
							<Copy class="size-4" />
							<span class="hidden sm:inline">Depuis un modèle</span>
						</Button>
					{/if}
				{/if}
				{#if (data.lastDoneList?.uncheckedItems?.length ?? 0) === 0}
					<!-- No unchecked items: submit directly -->
					<form method="POST" action="?/createList" use:enhance>
						<input type="hidden" name="includeUnchecked" value="false" />
						<Button type="submit" disabled={!isOnline}>
							<Plus class="size-4" />
							<span class="hidden sm:inline">Nouvelle liste</span>
						</Button>
					</form>
				{:else}
					<!-- Unchecked items exist: open dialog -->
					<Button type="button" onclick={handleNewListClick} disabled={!isOnline}>
						<Plus class="size-4" />
						<span class="hidden sm:inline">Nouvelle liste</span>
					</Button>
				{/if}
			{/if}
		</div>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List class="mb-4 w-full">
			<Tabs.Trigger value="lists" class="flex-1">
				<ShoppingCart class="mr-2 size-4" />
				Listes
			</Tabs.Trigger>
			<Tabs.Trigger value="templates" class="flex-1">
				<BookTemplate class="mr-2 size-4" />
				Modèles
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="lists">
			<div class="flex flex-col gap-3">
				{#if data.lists.length === 0}
					<div
						class="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center"
					>
						<ShoppingCart class="size-10 text-muted-foreground/40" />
						<p class="text-sm text-muted-foreground">Aucune liste de courses pour l'instant.</p>
					</div>
				{:else}
					{#each ongoingVisible as list (list.id)}
						<a
							href={resolve(`/lists/${list.id}`)}
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

					{#if ongoingVisible.length > 0 && doneVisible.length > 0}
						<Separator class="my-1" />
					{/if}

					{#each doneVisible as list (list.id)}
						<a
							href={resolve(`/lists/${list.id}`)}
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

					{#if hasMore}
						<div class="flex justify-center pt-1">
							<Button
								variant="ghost"
								size="sm"
								class="text-muted-foreground shadow-sm"
								onclick={loadMore}
							>
								Montrer plus
							</Button>
						</div>
					{/if}
				{/if}
			</div>
		</Tabs.Content>

		<Tabs.Content value="templates">
			<div class="flex flex-col gap-3">
				{#if data.templates.length === 0}
					<div
						class="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center"
					>
						<BookTemplate class="size-10 text-muted-foreground/40" />
						<p class="text-sm text-muted-foreground">Aucun modèle pour l'instant.</p>
					</div>
				{:else}
					{#each data.templates as template (template.id)}
						<a
							href={resolve(`/lists/${template.id}`)}
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
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>

<!-- Creation dialog (blank list or from template, shown when there are unchecked items or multiple templates) -->
{#if (data.lastDoneList?.uncheckedItems?.length ?? 0) > 0 || data.templates.length > 1}
	<Dialog.Root bind:open={createDialogOpen}>
		<Dialog.Content class="max-w-sm">
			<Dialog.Header>
				<Dialog.Title>
					{createMode === 'template' ? 'Créer depuis un modèle' : 'Nouvelle liste'}
				</Dialog.Title>
				<Dialog.Description>Configurez les options de votre nouvelle liste.</Dialog.Description>
			</Dialog.Header>

			<form
				method="POST"
				action={createMode === 'template' ? '?/createFromTemplate' : '?/createList'}
				use:enhance
			>
				{#if createMode === 'template'}
					<input type="hidden" name="templateId" value={selectedTemplateId} />
				{/if}
				<input type="hidden" name="includeUnchecked" value={includeUnchecked ? 'true' : 'false'} />

				<div class="flex flex-col gap-5 py-4">
					{#if createMode === 'template' && data.templates.length > 1}
						<div class="flex flex-col gap-2">
							<p class="text-sm font-medium">Modèle</p>
							{#each data.templates as template (template.id)}
								<Label
									class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
								>
									<input
										type="radio"
										name="templateChoice"
										value={template.id}
										checked={selectedTemplateId === template.id}
										onchange={() => (selectedTemplateId = template.id)}
										class="accent-primary"
									/>
									<div class="flex items-center gap-2">
										<BookTemplate class="size-4 shrink-0 text-muted-foreground" />
										<span class="text-sm font-medium">{template.title || 'Modèle sans titre'}</span>
									</div>
								</Label>
							{/each}
						</div>
					{/if}

					{#if (data.lastDoneList?.uncheckedItems?.length ?? 0) > 0}
						<div class="flex flex-col gap-3">
							<Label
								class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
							>
								<input
									type="checkbox"
									checked={includeUnchecked}
									onchange={() => (includeUnchecked = !includeUnchecked)}
									class="accent-primary"
								/>
								<div>
									<p class="text-sm leading-none font-medium">Ajouter les articles non achetés</p>
									<p class="mt-0.5 text-xs text-muted-foreground">
										Depuis
										<span class="font-medium text-foreground">{data.lastDoneList?.title}</span>
										du {formatDate(data.lastDoneList?.created_at ?? null)}
									</p>
								</div>
							</Label>
							{#if includeUnchecked}
								<ul class="ml-1 flex flex-col gap-1 rounded-lg border bg-muted/40 px-3 py-2">
									{#each data.lastDoneList?.uncheckedItems ?? [] as item (item)}
										<li class="text-sm text-muted-foreground">
											{item.replace(/^- \[ \] /, '')}
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}
				</div>

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (createDialogOpen = false)}>
						Annuler
					</Button>
					<Button type="submit" disabled={!isOnline}>Créer</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
