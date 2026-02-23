<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { ShoppingCart, Loader2 } from '@lucide/svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<div class="flex min-h-svh items-center justify-center px-4 py-12">
	<div class="w-full max-w-sm animate-in duration-300 zoom-in-95 fade-in">
		<div class="mb-6 flex flex-col items-center gap-2">
			<div
				class="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
			>
				<ShoppingCart class="size-6" />
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Sparfux</h1>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Bienvenue</CardTitle>
				<CardDescription>Entrez la phrase secrète pour accéder à l'application.</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							await update();
						};
					}}
					class="flex flex-col gap-4"
				>
					<div class="flex flex-col gap-2">
						<Label for="passphrase">Phrase secrète</Label>
						<Input
							id="passphrase"
							name="passphrase"
							type="password"
							autocomplete="current-password"
							required
							placeholder="••••••••"
							class="h-11 text-base"
						/>
					</div>

					{#if form?.error}
						<p class="text-sm text-destructive">{form.error}</p>
					{/if}

					<Button type="submit" class="mt-1 h-11 w-full text-base" disabled={loading}>
						{#if loading}
							<Loader2 class="animate-spin" />
							Vérification…
						{:else}
							Accéder
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
