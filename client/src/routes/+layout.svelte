<script>
  import '../app.css';
</script>

<div class="app">
  <main class="container">
    <slot />
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
  }
  
  main {
    flex: 1;
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
</style>
