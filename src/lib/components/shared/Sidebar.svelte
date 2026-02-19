<script lang="ts">
	import { ShoppingCart } from '@lucide/svelte';
	import { ACTIVE_USERS, type ActiveUser } from '$lib/services/user.service.svelte';
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
		<div
			class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
		>
			<ShoppingCart class="size-4" />
		</div>
		<span class="text-base font-semibold tracking-tight">Coursify</span>
	</div>

	<nav class="flex-1 overflow-y-auto px-3 py-4">
		{#if nav}
			{@render nav()}
		{/if}
	</nav>

	<div class="border-t p-3">
		<p class="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
			Identité
		</p>
		<div class="flex flex-col gap-1">
			{#each ACTIVE_USERS as u (u)}
				<button
					onclick={() => onSelect(u)}
					class="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors {activeUser ===
					u
						? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
						: 'text-sidebar-foreground hover:bg-sidebar-accent/60'}"
				>
					<div
						class="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold {activeUser ===
						u
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-muted-foreground/40'}"
					>
						{u === 'user_a' ? 'A' : 'B'}
					</div>
					{userLabels[u]}
				</button>
			{/each}
		</div>
	</div>
</aside>
