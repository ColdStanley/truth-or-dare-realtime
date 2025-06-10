import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function createRoom(roomId: string) {
  const { error } = await supabase.from('rooms').insert([
    {
      id: roomId,
      stage: 'choosing',
      current_question: null,
      current_asker: null,
    },
  ])
  if (error) throw error
}

export { supabase }
