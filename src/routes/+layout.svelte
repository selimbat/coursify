<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ShoppingCart, User } from '@lucide/svelte';
	import { userService, type ActiveUser } from '$lib/services/user.service.svelte';
	import { Button } from '$lib/components/ui/button';

	let { children } = $props();

	let mounted = $state(false);

	onMount(() => {
		userService.init();
		mounted = true;
	});

	const userLabels: Record<ActiveUser, string> = {
		user_a: 'Utilisateur A',
		user_b: 'Utilisateur B'
	};

	function selectUser(user: ActiveUser) {
		userService.setActiveUser(user);
	}

	let isLoginPage = $derived(page.url.pathname === '/login');
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isLoginPage}
	{@render children()}
{:else}
	<!-- ── Identity picker overlay ─────────────────────────────────────────── -->
	{#if mounted && userService.activeUser === null}
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
					<Button
						variant="outline"
						class="h-16 w-full gap-3 text-base"
						onclick={() => selectUser('user_a')}
					>
						<User class="size-5" />
						Utilisateur A
					</Button>
					<Button
						variant="outline"
						class="h-16 w-full gap-3 text-base"
						onclick={() => selectUser('user_b')}
					>
						<User class="size-5" />
						Utilisateur B
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ── App shell ───────────────────────────────────────────────────────── -->
	<div class="flex min-h-svh">
		<!-- Desktop sidebar -->
		<aside class="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar md:flex">
			<!-- Logo -->
			<div class="flex h-16 shrink-0 items-center gap-2.5 border-b px-5">
				<div
					class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
				>
					<ShoppingCart class="size-4" />
				</div>
				<span class="text-base font-semibold tracking-tight">Coursify</span>
			</div>

			<!-- Nav (future stories will populate this) -->
			<nav class="flex-1 overflow-y-auto px-3 py-4"></nav>

			<!-- User identity switcher -->
			<div class="border-t p-3">
				<p class="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
					Identité
				</p>
				<div class="flex flex-col gap-1">
					{#each ['user_a', 'user_b'] as u (u)}
						<button
							onclick={() => selectUser(u as ActiveUser)}
							class="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors {userService.activeUser ===
							u
								? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
								: 'text-sidebar-foreground hover:bg-sidebar-accent/60'}"
						>
							<div
								class="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold {userService.activeUser ===
								u
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-muted-foreground/40'}"
							>
								{u === 'user_a' ? 'A' : 'B'}
							</div>
							{userLabels[u as ActiveUser]}
						</button>
					{/each}
				</div>
			</div>
		</aside>

		<!-- Main content area -->
		<div class="flex min-h-svh w-full flex-col md:pl-60">
			<main class="flex-1 pb-20 md:pb-0">
				{@render children()}
			</main>
		</div>
	</div>

	<!-- ── Mobile bottom nav ───────────────────────────────────────────────── -->
	<nav
		class="fixed right-0 bottom-0 left-0 z-40 flex h-16 items-center border-t bg-background px-4 md:hidden"
	>
		<!-- Brand -->
		<div class="flex flex-1 items-center gap-2">
			<div
				class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
			>
				<ShoppingCart class="size-4" />
			</div>
			<span class="text-sm font-semibold">Coursify</span>
		</div>

		<!-- User toggle pill -->
		<div class="flex items-center gap-1 rounded-full border p-1">
			{#each ['user_a', 'user_b'] as u (u)}
				<button
					onclick={() => selectUser(u as ActiveUser)}
					class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors {userService.activeUser ===
					u
						? 'bg-primary text-primary-foreground shadow-sm'
						: 'text-muted-foreground hover:bg-muted'}"
				>
					{userLabels[u as ActiveUser]}
				</button>
			{/each}
		</div>
	</nav>
{/if}
