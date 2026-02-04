<!-- src/routes/+page.svelte -->
<script>
  import { onMount } from "svelte";

  let status = "loading";
  let message = "";

  onMount(async () => {
    try {
      const response = await fetch("/api/health");
      if (response.ok) {
        const data = await response.json();
        status = "connected";
        message = data.message;
      } else {
        status = "error";
        message = "Failed to connect to server";
      }
    } catch (error) {
      status = "error";
      message =
        error instanceof Error ? error.message : "An unknown error occurred";
    }
  });
</script>

<main>
  <h1>Coursify</h1>
  <p>Shared shopping list app for couples</p>

  <div
    class="status"
    class:connected={status === "connected"}
    class:error={status === "error"}
  >
    {#if status === "loading"}
      <p>Connecting to server...</p>
    {:else if status === "connected"}
      <p>✓ {message}</p>
    {:else}
      <p>✗ {message}</p>
    {/if}
  </div>
</main>

<style>
  main {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1rem;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }

  h1 {
    color: #333;
  }

  .status {
    padding: 1rem;
    border-radius: 4px;
    margin-top: 2rem;
  }

  .status.connected {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .status.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
</style>
