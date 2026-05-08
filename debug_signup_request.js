// Debug the exact signup request
// Paste this in browser console to see what's being sent

console.log('🔍 Debugging signup request...');

// Check if environment variables are loaded
console.log('Environment check:');
console.log('VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');

// Test the exact request format
async function debugSignup() {
  try {
    const response = await fetch('https://lavlemqycumxlhoxexdi.supabase.co/auth/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdmxlbXF5Y3VteGxob3hleGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjMyNDUsImV4cCI6MjA4ODEzOTI0NX0.vfjJHfd76qB-3Z0N9b82u94_ZkyETs8eht_h8hAC9EM',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdmxlbXF5Y3VteGxob3hleGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjMyNDUsImV4cCI6MjA4ODEzOTI0NX0.vfjJHfd76qB-3Z0N9b82u94_ZkyETs8eht_h8hAC9EM'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        data: {
          name: 'Test User'
        }
      })
    });

    console.log('📡 Request details:', {
      url: 'https://lavlemqycumxlhoxexdi.supabase.co/auth/v1/signup',
      method: 'POST',
      status: response.status,
      statusText: response.statusText
    });

    const result = await response.json();
    console.log('📥 Response:', result);

    if (response.ok) {
      console.log('✅ Signup successful!');
    } else {
      console.log('❌ Signup failed:', result);
    }

  } catch (error) {
    console.error('💥 Network error:', error);
  }
}

// Run the debug
debugSignup();

console.log('🔧 Check the Network tab in DevTools to see the actual request');
