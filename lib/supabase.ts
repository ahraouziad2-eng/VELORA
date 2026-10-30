import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  LAND_IMAGES: 'land-images',
  LAND_DOCUMENTS: 'land-documents',
  PROJECT_DOCUMENTS: 'project-documents',
  MESSAGES: 'messages',
  CONTRACTS: 'contracts',
  AD_IMAGES: 'ad-images',
} as const;
