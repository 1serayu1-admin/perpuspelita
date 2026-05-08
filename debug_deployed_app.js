// Debug script for deployed app
// Paste this in browser console on https://perpustakaansmkpelitabangunrejo.netlify.app/login

console.log('🔍 Debugging deployed app...');

// 1. Check if environment variables are loaded
console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');

// 2. Check if Supabase client is available
setTimeout(() => {
  console.log('Checking Supabase client...');
  
  // Try to access the Supabase client
  if (typeof window !== 'undefined') {
    // Check if there's a global supabase variable
    console.log('Global supabase:', window.supabase);
    
    // Try to get the supabase client from the app
    try {
      const supabaseClient = window.supabase?.createClient?.(
        import.meta.env?.VITE_SUPABASE_URL,
        import.meta.env?.VITE_SUPABASE_ANON_KEY
      );
      
      if (supabaseClient) {
        console.log('✅ Supabase client created successfully');
        
        // Test a simple auth call
        supabaseClient.auth.getSession().then(({ data, error }) => {
          console.log('Session check result:', { data, error });
        });
        
      } else {
        console.log('❌ Supabase client creation failed');
      }
    } catch (err) {
      console.error('❌ Supabase client error:', err);
    }
  }
  
  // 3. Check for loading states
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
  console.log('Loading elements found:', loadingElements.length);
  
  // 4. Check for error messages
  const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
  console.log('Error elements found:', errorElements.length);
  
  // 5. Check React app status
  const root = document.getElementById('root');
  if (root) {
    console.log('Root element innerHTML length:', root.innerHTML.length);
    console.log('Root element has children:', root.children.length > 0);
  }
  
}, 2000);

console.log('🔧 Check browser console for detailed debugging info');
