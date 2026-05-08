// Simple debug script without import.meta
// Paste this in browser console on https://perpustakaansmkpelitabangunrejo.netlify.app/login

console.log('🔍 Debugging deployed app...');

// 1. Check if React app is loaded
setTimeout(() => {
  const root = document.getElementById('root');
  if (root) {
    console.log('Root element innerHTML length:', root.innerHTML.length);
    console.log('Root element has children:', root.children.length > 0);
    console.log('Root element content preview:', root.innerHTML.substring(0, 200));
  }
  
  // 2. Check for loading elements
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
  console.log('Loading elements found:', loadingElements.length);
  
  // 3. Check for error elements
  const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
  console.log('Error elements found:', errorElements.length);
  
  // 4. Check if there are any script errors
  const scripts = document.querySelectorAll('script');
  console.log('Script elements found:', scripts.length);
  
  // 5. Check network tab for failed requests
  console.log('🔧 Check Network tab for failed requests (especially main.tsx)');
  
}, 1000);

console.log('🔧 Debug script loaded - check console for results');
