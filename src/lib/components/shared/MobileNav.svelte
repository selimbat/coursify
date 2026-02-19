<script lang="ts">
	import { ShoppingCart } from '@lucide/svelte';
	import { ACTIVE_USERS, type ActiveUser } from '$lib/services/user.service.svelte';

	let {
		activeUser,
		userLabels,
		onSelect
	}: {
		activeUser: ActiveUser | null;
		userLabels: Record<ActiveUser, string>;
		onSelect: (user: ActiveUser) => void;
	} = $props();
</script>

<nav
	class="fixed right-0 bottom-0 left-0 z-40 flex h-16 items-center border-t bg-background px-4 md:hidden"
>
	<div class="flex flex-1 items-center gap-2">
		<div
			class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
		>
			<ShoppingCart class="size-4" />
		</div>
		<span class="text-sm font-semibold">Coursify</span>
	</div>

	<div class="flex items-center gap-1 rounded-full border p-1">
		{#each ACTIVE_USERS as u (u)}
			<button
				onclick={() => onSelect(u)}
				class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors {activeUser ===
				u
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'text-muted-foreground hover:bg-muted'}"
			>
				{userLabels[u]}
			</button>
		{/each}
	</div>
</nav>
