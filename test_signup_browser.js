// Test signup directly in browser console
// Copy this code and paste in browser dev tools (F12 -> Console)

const supabaseUrl = 'https://lavlemqycumxlhoxexdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdmxlbXF5Y3VteGxob3hleGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjMyNDUsImV4cCI6MjA4ODEzOTI0NX0.vfjJHfd76qB-3Z0N9b82u94_ZkyETs8eht_h8hAC9EM';

// Load Supabase client if not available
if (typeof window.supabase === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  document.head.appendChild(script);
  
  setTimeout(() => {
    testSignup();
  }, 1000);
} else {
  testSignup();
}

async function testSignup() {
  console.log('Testing signup with correct credentials...');
  
  try {
    const { createClient } = window.supabase || window.supabaseJs;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signUp({
      email: 'testuser@example.com',
      password: 'password123',
      options: {
        data: {
          name: 'Test User'
        }
      }
    });

    if (error) {
      console.error('❌ Signup failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
    } else {
      console.log('✅ Signup successful!', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

console.log('🔧 Paste this in browser console to test signup');
console.log('📧 Email: testuser@example.com');
console.log('🔑 Password: password123');
