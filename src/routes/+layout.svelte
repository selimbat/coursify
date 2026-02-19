<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import IdentityPicker from '$lib/components/shared/IdentityPicker.svelte';
	import MobileNav from '$lib/components/shared/MobileNav.svelte';
	import Sidebar from '$lib/components/shared/Sidebar.svelte';
	import { userService, type ActiveUser } from '$lib/services/user.service.svelte';

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
	let activeUser = $derived(userService.activeUser);
	let showIdentityPicker = $derived(mounted && activeUser === null);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isLoginPage}
	{@render children()}
{:else}
	<IdentityPicker show={showIdentityPicker} {userLabels} onSelect={selectUser} />

	<div class="flex min-h-svh">
		<Sidebar {activeUser} {userLabels} onSelect={selectUser} />

		<div class="flex min-h-svh w-full flex-col md:pl-60">
			<main class="flex-1 pb-20 md:pb-0">
				{@render children()}
			</main>
		</div>
	</div>

	<MobileNav {activeUser} {userLabels} onSelect={selectUser} />
{/if}
