<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { WifiOff, AlertCircle, Home } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let isOffline = $state(false);

	onMount(() => {
		isOffline = !navigator.onLine;

		const handleOnline = () => (isOffline = false);
		const handleOffline = () => (isOffline = true);
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	let status = $derived(page.status);
	let message = $derived(page.error?.message ?? 'Une erreur est survenue');
</script>

<div class="flex min-h-svh items-center justify-center p-6">
	<div class="mx-auto max-w-sm text-center">
		{#if isOffline}
			<div class="mb-6 flex justify-center">
				<div class="rounded-full bg-muted p-4">
					<WifiOff class="size-8 text-muted-foreground" />
				</div>
			</div>
			<h1 class="mb-2 text-xl font-semibold">Mode hors ligne</h1>
			<p class="mb-6 text-sm text-muted-foreground">
				Cette page n'est pas disponible hors ligne. Vérifiez votre connexion et réessayez.
			</p>
		{:else}
			<div class="mb-6 flex justify-center">
				<div class="rounded-full bg-muted p-4">
					<AlertCircle class="size-8 text-muted-foreground" />
				</div>
			</div>
			<h1 class="mb-2 text-xl font-semibold">Erreur {status}</h1>
			<p class="mb-6 text-sm text-muted-foreground">{message}</p>
		{/if}
		<Button href="/" variant="outline">
			<Home class="size-4" />
			Retour à l'accueil
		</Button>
	</div>
</div>
