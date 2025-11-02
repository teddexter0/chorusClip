// lib/profanityFilter.js

const profanityList = [
  'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell', 'crap',
  'dick', 'pussy', 'cock', 'bastard', 'whore', 'slut', 'nigger', 'nigga',
  'cunt', 'fag', 'faggot', 'retard', 'rape', 'nazi', 'kike', 'chink'
];

// Character substitutions (leetspeak)
const substitutions = {
  '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i',
  '0': 'o', '$': 's', '7': 't', '5': 's', '8': 'b'
};

// Normalize text (remove special chars, convert leetspeak)
const normalize = (text) => {
  let normalized = text.toLowerCase();
  
  // Replace substitutions
  for (const [char, letter] of Object.entries(substitutions)) {
    normalized = normalized.replace(new RegExp(`\\${char}`, 'g'), letter);
  }
  
  // Remove spaces, underscores, periods, hyphens
  normalized = normalized.replace(/[\s_.-]/g, '');
  
  return normalized;
};

// Levenshtein distance (catches misspellings)
const levenshtein = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

export const validateDisplayName = (name) => {
  const normalized = normalize(name);
  
  // Check for exact matches or close matches
  for (const badWord of profanityList) {
    // Exact match
    if (normalized.includes(badWord)) {
      return { valid: false, message: 'Display name contains inappropriate language' };
    }
    
    // Check if any part of the name is within 1-2 characters of a bad word
    for (let i = 0; i <= normalized.length - badWord.length; i++) {
      const substring = normalized.substring(i, i + badWord.length);
      const distance = levenshtein(substring, badWord);
      
      if (distance <= 1) { // Within 1 character difference
        return { valid: false, message: 'Display name contains inappropriate language' };
      }
    }
  }
  
  // Check length
  if (name.length < 3) {
    return { valid: false, message: 'Display name must be at least 3 characters' };
  }
  
  if (name.length > 20) {
    return { valid: false, message: 'Display name must be less than 20 characters' };
  }
  
  // Check valid characters
  const validPattern = /^[a-zA-Z0-9_\s]+$/;
  if (!validPattern.test(name)) {
    return { valid: false, message: 'Display name can only contain letters, numbers, underscores, and spaces' };
  }
  
  return { valid: true };
};