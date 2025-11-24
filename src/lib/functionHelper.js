import { supabase } from '@/lib/customSupabaseClient';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function invokeWithRetry(functionName, options, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const result = await supabase.functions.invoke(functionName, options);
      if (result.error) {
        // If it's a "business logic" error (e.g., user already exists), don't retry.
        // We only want to retry on network/server failures.
        // A Fetch error is a good indicator of a network/server issue.
        if (result.error.message.toLowerCase().includes('fetch error')) {
           throw new Error(result.error.message); // This will be caught and retried
        }
        // For other errors, return them directly without retrying.
        return result; 
      }
      return result; // Success
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        console.error(`Failed after ${retries} attempts for function ${functionName}:`, error);
        // Re-throw the last error to be handled by the caller
        throw error;
      }
      console.log(`Attempt ${attempt} failed for ${functionName}. Retrying in 1 second...`);
      await delay(1000); // Wait 1 second before retrying
    }
  }
}