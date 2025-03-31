<script>
 import { goto } from '$app/navigation';
 import { calculateDistance } from '$lib/services/distanceService';
 import { validateAddressInput } from '$lib/services/addressService';
 import { onMount } from 'svelte';
 import '$lib/styles/distance-calculator.css';
 
 let sourceAddress = '';
 let destinationAddress = '';
 let unit = 'miles';
 let distance = null;
 let isCalculating = false;
 let error = '';
 let showErrorToast = false;
 
 onMount(() => {
   return () => {};
 });
 
 $: hasInput = sourceAddress.trim() !== '' || destinationAddress.trim() !== '';
 
 function selectSuggestion(type, suggestion) {
   if (type === 'source') {
     sourceAddress = suggestion;
     sourceSuggestions = [];
   } else {
     destinationAddress = suggestion;
     destSuggestions = [];
   }
 }
 
 function handleCalculate() {
   const sanitizedSource = validateAddressInput(sourceAddress);
   const sanitizedDestination = validateAddressInput(destinationAddress);
   
   if (sanitizedSource !== sourceAddress) {
     sourceAddress = sanitizedSource;
   }
   
   if (sanitizedDestination !== destinationAddress) {
     destinationAddress = sanitizedDestination;
   }
   
   if (!sanitizedSource || !sanitizedDestination) {
     error = 'Please enter both source and destination addresses.';
     showErrorToast = true;
     setTimeout(() => showErrorToast = false, 5000);
     return;
   }
   
   error = '';
   showErrorToast = false;
   isCalculating = true;
   
   calculateDistance(sanitizedSource, sanitizedDestination)
     .then(result => {
       console.log('API result:', result);
       distance = {
         miles: result && result.miles !== undefined ? result.miles : 
                result && result.distance && result.distance.miles !== undefined ? result.distance.miles : 0,
         kilometers: result && result.kilometers !== undefined ? result.kilometers : 
                     result && result.distance && result.distance.kilometers !== undefined ? result.distance.kilometers : 0
       };
       console.log('Processed distance:', distance);
     })
     .catch(err => {
       console.error('Calculation failed:', err);
       
       if (err.status === 429 || err.message?.includes('rate limit') || 
           (err.response && err.response.status === 429)) {
         error = 'Rate limit exceeded. Please try again later.';
       } else {
         error = 'Something went wrong and the calculation failed.';
       }
       
       showErrorToast = true;
       setTimeout(() => showErrorToast = false, 5000);
       distance = null;
     })
     .finally(() => {
       isCalculating = false;
     });
 }

 function viewHistoricalQueries() {
   try {
     goto('/historical-queries').catch(err => {
       console.error('Navigation failed:', err);
       error = 'Something went wrong and the navigation failed.';
       showErrorToast = true;
       setTimeout(() => showErrorToast = false, 5000);
     });
   } catch (err) {
     console.error('Navigation error:', err);
     error = 'Something went wrong and the navigation failed.';
     showErrorToast = true;
     setTimeout(() => showErrorToast = false, 5000);
   }
 }
 
 function closeErrorToast() {
   showErrorToast = false;
 }
 
 function handleSourceInput(event) {
   sourceAddress = event.target.value;
 }
 
 function handleDestInput(event) {
   destinationAddress = event.target.value;
 }
</script>

<div class="calculator">
 <div class="calculator-header">
   <div class="header-left">
     <h1>Distance Calculator</h1>
     <p>Prototype web application for calculating the distance between addresses.</p>
   </div>
   
   <div class="header-right">
     <button on:click={viewHistoricalQueries} class="view-history-btn">
       <span>View Historical Queries</span>
       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <polyline points="9 18 15 12 9 6"></polyline>
       </svg>
     </button>
   </div>
 </div>
 
 <div class="calculator-form">
   <div class="form-row">
     <div class="form-group">
       <label for="sourceAddress">Source Address</label>
       <input 
         type="text" 
         id="sourceAddress" 
         value={sourceAddress}
         on:input={handleSourceInput}
         placeholder="Input address"
       />
     </div>
     
     <div class="form-group">
       <label for="destinationAddress">Destination Address</label>
       <input 
         type="text" 
         id="destinationAddress" 
         value={destinationAddress}
         on:input={handleDestInput}
         placeholder="Input address"
       />
     </div>
     
     <div class="form-group unit-group">
       <label>Unit</label>
       <div class="radio-group">
         <label class="radio-label">
           <input type="radio" bind:group={unit} value="miles" />
           <span>Miles</span>
         </label>
         <label class="radio-label">
           <input type="radio" bind:group={unit} value="kilometers" />
           <span>Kilometers</span>
         </label>
         <label class="radio-label">
           <input type="radio" bind:group={unit} value="both" />
           <span>Both</span>
         </label>
       </div>
     </div>
     
     <div class="form-group distance-display">
       <label>Distance</label>
       {#if distance}
         <div class="distance-value">
           {#if unit === 'miles' || unit === 'both'}
             <div>{(distance.miles !== undefined ? distance.miles : 0).toLocaleString()} miles</div>
           {/if}
           {#if unit === 'kilometers' || unit === 'both'}
             <div>{(distance.kilometers !== undefined ? distance.kilometers : 0).toLocaleString()} kilometers</div>
           {/if}
         </div>
       {:else}
         <div class="distance-placeholder">-</div>
       {/if}
     </div>
   </div>
   
   <div class="form-actions">
     <button 
       on:click={handleCalculate} 
       disabled={isCalculating} 
       class="calculate-btn"
       class:active={hasInput}
     >
       {#if isCalculating}
         Calculating...
       {:else}
         Calculate Distance
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
       {/if}
     </button>
   </div>
 </div>
 
 {#if showErrorToast}
   <div class="error-toast">
     <div class="error-toast-content">
       <div class="error-icon-container">
         <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
           <circle cx="12" cy="12" r="10" fill="#e53e3e"/>
           <path d="M12 8v5M12 16v.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
         </svg>
       </div>
       <div class="error-message-content">
         <div class="error-title">Calculation failed</div>
         <div class="error-text">{error}</div>
       </div>
     </div>
     <button class="close-toast" on:click={closeErrorToast}>
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
         <line x1="18" y1="6" x2="6" y2="18"></line>
         <line x1="6" y1="6" x2="18" y2="18"></line>
       </svg>
     </button>
   </div>
 {/if}
</div>
