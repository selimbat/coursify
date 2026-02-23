<script lang="ts">
	import { onMount } from 'svelte';
	import { WifiOff } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';

	let isOnline = $state(true);

	onMount(() => {
		isOnline = navigator.onLine;

		const handleOnline = () => (isOnline = true);
		const handleOffline = () => (isOnline = false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

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
