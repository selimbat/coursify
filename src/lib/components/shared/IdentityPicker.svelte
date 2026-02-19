<script lang="ts">
	import { ShoppingCart, User } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { ACTIVE_USERS, type ActiveUser } from '$lib/services/user.service.svelte';

	let {
		show,
		userLabels,
		onSelect
	}: {
		show: boolean;
		userLabels: Record<ActiveUser, string>;
		onSelect: (user: ActiveUser) => void;
	} = $props();
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm"
	>
		<div class="w-full max-w-sm animate-in duration-300 zoom-in-95 fade-in">
			<div class="mb-6 flex flex-col items-center gap-2">
				<div
					class="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
				>
					<ShoppingCart class="size-6" />
				</div>
				<h1 class="text-2xl font-bold tracking-tight">Qui êtes-vous ?</h1>
				<p class="text-center text-sm text-muted-foreground">
					Choisissez votre identité pour cette session.
				</p>
			</div>
			<div class="flex flex-col gap-3">
				{#each ACTIVE_USERS as u (u)}
					<Button variant="outline" class="h-16 w-full gap-3 text-base" onclick={() => onSelect(u)}>
						<User class="size-5" />
						{userLabels[u]}
					</Button>
				{/each}
			</div>
		</div>
	</div>
{/if}
