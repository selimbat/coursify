<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import IdentityPicker from '$lib/components/shared/IdentityPicker.svelte';
	import MobileNav from '$lib/components/shared/MobileNav.svelte';
	import NetworkStatus from '$lib/components/shared/NetworkStatus.svelte';
	import Sidebar from '$lib/components/shared/Sidebar.svelte';
	import { userService, type ActiveUser } from '$lib/services/user.service.svelte';
	import { offlineService } from '$lib/services/offline.service.svelte';
	import { themeService } from '$lib/services/theme.svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { registerSW } from 'virtual:pwa-register';

	const webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

	let { children } = $props();

	let mounted = $state(false);

	onMount(() => {
		themeService.init();
		userService.init();
		offlineService.init();
		mounted = true;
		registerSW({ immediate: true });
	});

	const userLabels: Record<ActiveUser, string> = {
		user_a: 'Anna',
		user_b: 'Selim'
	};

	function selectUser(user: ActiveUser) {
		userService.setActiveUser(user);
	}

	let isLoginPage = $derived(page.url.pathname === '/login');
	let activeUser = $derived(userService.activeUser);
	let showIdentityPicker = $derived(mounted && activeUser === null);
</script>

<svelte:head>
	{@html webManifestLink}
	<title>Sparfux</title>
</svelte:head>

<NetworkStatus />

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
