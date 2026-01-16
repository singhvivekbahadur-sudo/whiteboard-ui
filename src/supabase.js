import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bjiemtutvutdibiwspus.supabase.co'
const supabaseAnonKey = 'sb_publishable_huQjgJbhHi2ZkVnucJOQHw_cpUuPcWV'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)