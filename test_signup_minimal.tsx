// Test signup with minimal parameters to isolate the issue
import { createClient } from '@supabase/supabase-js';

// Test with hardcoded values first
const supabaseUrl = 'https://lavlemqycumxlhoxexdi.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY_HERE'; // Replace with actual key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testMinimalSignup() {
  console.log('Testing minimal signup...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });

    if (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }

    console.log('Signup success:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

// Test in browser console:
// 1. Copy this code to browser console
// 2. Replace YOUR_ANON_KEY_HERE with actual key from .env
// 3. Call testMinimalSignup()
