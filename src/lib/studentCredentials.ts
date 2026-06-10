// Helper functions for generating student credentials

/**
 * Generate username from name and class
 * Format: nama.kelas (lowercase, no spaces)
 * Example: "Ahmad Fauzi" + "X-A" → "ahmad.fauzi.xa"
 */
export function generateUsername(name: string, className: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '.');
  
  const cleanClass = className
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  return `${cleanName}.${cleanClass}`;
}

/**
 * Generate random password (8 characters)
 * Format: 3 letters + 3 numbers + 2 special chars
 */
export function generatePassword(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%';
  
  let password = '';
  
  // 3 letters
  for (let i = 0; i < 3; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 3 numbers
  for (let i = 0; i < 3; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  // 2 special chars
  for (let i = 0; i < 2; i++) {
    password += special.charAt(Math.floor(Math.random() * special.length));
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate email from username
 * Format: username@perpuspelita.com
 */
export function generateEmail(username: string): string {
  return `${username}@perpuspelita.com`;
}
