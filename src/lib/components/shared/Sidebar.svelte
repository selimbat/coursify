<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { ACTIVE_USERS, type ActiveUser } from '$lib/services/user.service.svelte';
	import { themeService } from '$lib/services/theme.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';

	let {
		activeUser,
		userLabels,
		onSelect,
		nav
	}: {
		activeUser: ActiveUser | null;
		userLabels: Record<ActiveUser, string>;
		onSelect: (user: ActiveUser) => void;
		nav?: Snippet | null;
	} = $props();
</script>

<aside class="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar md:flex">
	<div class="flex h-16 shrink-0 items-center gap-2.5 border-b px-5">
		<img src="/favicon.svg" alt="Logo Sparfux" class="size-9" />
		<span class="text-base font-semibold tracking-tight">Sparfux</span>
	</div>

	<nav class="flex-1 overflow-y-auto px-3 py-4">
		{#if nav}
			{@render nav()}
		{/if}
	</nav>

	<div class="border-t p-3">
		<div class="mb-3 flex items-center justify-between px-2">
			<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Apparence</p>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => themeService.toggle()}
				aria-label="Basculer le thème"
			>
				{#if themeService.isDark}
					<Sun class="size-4" />
				{:else}
					<Moon class="size-4" />
				{/if}
			</Button>
		</div>

		<p class="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
			Identité
		</p>
		<div class="flex flex-col gap-1">
			{#each ACTIVE_USERS as u (u)}
				<Button
					variant="ghost"
					onclick={() => onSelect(u)}
					class="justify-start gap-2.5 px-2 {activeUser === u
						? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent'
						: 'text-sidebar-foreground hover:bg-sidebar-accent/60'}"
				>
					<div
						class="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold {activeUser ===
						u
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-muted-foreground/40'}"
					>
						{u === 'user_a' ? 'A' : 'S'}
					</div>
					{userLabels[u]}
				</Button>
			{/each}
		</div>
	</div>
</aside>
