import { createClient } from '@supabase/supabase-js'

export const Supabase = createClient(
  import.meta.env.VITE_SUPBASE_URL,
  import.meta.env.VITE_SUPBASE_ANON_KEY
)