<script lang="ts">
	import ListDetails from '$lib/components/shared/ListDetails.svelte';

	let { data } = $props();
</script>

<ListDetails list={data.list} />
