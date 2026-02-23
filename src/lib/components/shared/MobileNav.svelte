<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { ACTIVE_USERS, type ActiveUser } from '$lib/services/user.service.svelte';
	import { themeService } from '$lib/services/theme.svelte';
	import { Button } from '$lib/components/ui/button';

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
		<img src="/favicon.svg" alt="Logo Sparfux" class="size-8" />
		<span class="text-sm font-semibold">Sparfux</span>
	</div>

	<Button
		variant="ghost"
		size="icon-sm"
		class="mr-2"
		onclick={() => themeService.toggle()}
		aria-label="Basculer le thème"
	>
		{#if themeService.isDark}
			<Sun class="size-4" />
		{:else}
			<Moon class="size-4" />
		{/if}
	</Button>

	<div class="flex items-center gap-1 rounded-full border p-1">
		{#each ACTIVE_USERS as u (u)}
			<Button
				variant={activeUser === u ? 'default' : 'ghost'}
				size="sm"
				onclick={() => onSelect(u)}
				class="rounded-full px-3 text-xs {activeUser === u ? 'shadow-sm' : 'text-muted-foreground'}"
			>
				{userLabels[u]}
			</Button>
		{/each}
	</div>
</nav>
