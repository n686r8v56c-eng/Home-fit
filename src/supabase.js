import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY||import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key?createClient(url,key):null;
const exerciseUrl=import.meta.env.VITE_EXERCISE_SUPABASE_URL||'https://nywmfapcjqlvjhrdbrrc.supabase.co';
const exerciseKey=import.meta.env.VITE_EXERCISE_SUPABASE_ANON_KEY||import.meta.env.VITE_EXERCISE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_Tzx05-pZTox6Kwpg-PktMA_-qz_g2MY';
// Reuse the Home Fit session when both apps use the same project. A distinct
// source project keeps its own session and user IDs, so existing paths still work.
export const exerciseSupabase=exerciseUrl&&exerciseUrl!==url
 ? (exerciseKey?createClient(exerciseUrl,exerciseKey,{auth:{storageKey:'home-fit-exercise-auth'}}):null)
 : supabase;
