<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getHistory } from '$lib/services/distanceService';
  
  let queries = [];
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    try {
      const historyData = await getHistory(50);
      console.log("History data received:", historyData);
      
      if (historyData.results && Array.isArray(historyData.results)) {
        queries = historyData.results;
      } else if (Array.isArray(historyData)) {
        queries = historyData;
      } else if (historyData.queries && Array.isArray(historyData.queries)) {
        queries = historyData.queries;
      } else {
        console.error("Unexpected history data format:", historyData);
        queries = [];
      }
      
      console.log("Processed queries:", queries);
    } catch (err) {
      console.error("Error fetching history:", err);
      error = err.message || 'Failed to load historical queries.';
    } finally {
      isLoading = false;
    }
  });
  
  function backToCalculator() {
    goto('/');
  }
</script>

<div class="historical-queries">
  <div class="queries-header">
    <div class="header-left">
      <h1>Distance Calculator</h1>
      <p>Prototype web application for calculating the distance between addresses.</p>
    </div>
    
    <div class="header-right">
      <button on:click={backToCalculator} class="back-button">
        Back to Calculator
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="8" y1="6" x2="16" y2="6"></line>
          <line x1="8" y1="10" x2="10" y2="10"></line>
          <line x1="14" y1="10" x2="16" y2="10"></line>
          <line x1="8" y1="14" x2="10" y2="14"></line>
          <line x1="14" y1="14" x2="16" y2="14"></line>
          <line x1="8" y1="18" x2="10" y2="18"></line>
          <line x1="14" y1="18" x2="16" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
  
  <div class="queries-content">
    <h2>Historical Queries</h2>
    <p>History of the user's queries.</p>
    
    {#if isLoading}
      <div class="loading-state">
        <p>Loading historical queries...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p>{error}</p>
      </div>
    {:else if queries.length === 0}
      <div class="empty-state">
        <p>No queries have been made yet.</p>
      </div>
    {:else}
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Source Address</th>
              <th>Destination Address</th>
              <th>Distance in Miles</th>
              <th>Distance in Kilometers</th>
            </tr>
          </thead>
          <tbody>
            {#each queries as query}
              <tr>
                <td>
                  {#if query.address1?.query}
                    {query.address1.query}
                  {:else if query.sourceAddress}
                    {query.sourceAddress}
                  {:else if query.address1}
                    {query.address1}
                  {:else}
                    [Source Address]
                  {/if}
                </td>
                <td>
                  {#if query.address2?.query}
                    {query.address2.query}
                  {:else if query.destinationAddress}
                    {query.destinationAddress}
                  {:else if query.address2}
                    {query.address2}
                  {:else}
                    [Destination Address]
                  {/if}
                </td>
                <td>
                  {#if query.distance?.miles !== undefined}
                    {query.distance.miles.toLocaleString()}
                  {:else if query.miles !== undefined}
                    {query.miles.toLocaleString()}
                  {:else if query.distanceMiles !== undefined}
                    {query.distanceMiles.toLocaleString()}
                  {:else}
                    [Distance Miles]
                  {/if}
                </td>
                <td>
                  {#if query.distance?.kilometers !== undefined}
                    {query.distance.kilometers.toLocaleString()}
                  {:else if query.kilometers !== undefined}
                    {query.kilometers.toLocaleString()}
                  {:else if query.distanceKilometers !== undefined}
                    {query.distanceKilometers.toLocaleString()}
                  {:else}
                    [Distance Kilometers]
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  .historical-queries {
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin: 0;
    max-width: 100%;
  }
  
  .queries-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid #ddd;
  }
  
  .header-left h1 {
    font-size: 1.75rem;
    margin: 0 0 0.5rem 0;
    font-weight: 400;
    color: #333;
  }
  
  .header-left p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .header-right {
    display: flex;
    align-items: center;
  }
  
  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 0;
    color: #333;
    font-size: 0.9rem;
    cursor: pointer;
  }
  
  .back-button:hover {
    background-color: #e5e5e5;
  }
  
  .queries-content {
    padding: 1.5rem;
  }
  
  .queries-content h2 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }
  
  .queries-content p {
    margin: 0 0 1.5rem 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border: 1px solid #ddd;
    font-size: 0.9rem;
  }
  
  th {
    background-color: #f5f5f5;
    font-weight: 500;
    color: #333;
  }
  
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  .loading-state, .error-state, .empty-state {
    padding: 2rem;
    text-align: center;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
  }
  
  .error-state {
    background-color: #fee;
    border-color: #e88;
    color: #c33;
  }
  
  @media (max-width: 768px) {
    .queries-header {
      flex-direction: column;
    }
    
    .header-right {
      margin-top: 1rem;
      align-self: flex-end;
    }
  }
</style>
