<script lang="ts">
	import { WifiOff, Wifi } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import { offlineService } from '$lib/services/offline.service.svelte';

	let isOnline = $derived(offlineService.isOnline);
	let reconnectInfo = $derived(offlineService.reconnectInfo);

	let reconnectLabel = $derived.by(() => {
		if (reconnectInfo.status !== 'synced') return '';
		return reconnectInfo.syncedCount > 0
			? `Connexion rétablie · ${reconnectInfo.syncedCount} liste${reconnectInfo.syncedCount > 1 ? 's' : ''} synchronisée${reconnectInfo.syncedCount > 1 ? 's' : ''}`
			: 'Connexion rétablie';
	});
</script>

<!-- Offline banner -->
{#if !isOnline}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
		in:fly={{ y: -20, duration: 250 }}
		out:fade={{ duration: 200 }}
	>
		<div
			class="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-md"
		>
			<WifiOff class="size-3.5 text-muted-foreground" />
			<span class="text-muted-foreground">Mode hors ligne</span>
		</div>
	</div>
{/if}

<!-- Reconnect success chip -->
{#if isOnline && reconnectInfo.status === 'synced'}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
		in:fly={{ y: -20, duration: 250 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<div
			class="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 shadow-md dark:border-green-800 dark:bg-green-950/60 dark:text-green-400"
		>
			<Wifi class="size-3.5" />
			<span>{reconnectLabel}</span>
		</div>
	</div>
{/if}
