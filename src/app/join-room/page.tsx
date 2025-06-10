'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../../../lib/supabase'

export default function JoinRoomPage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    setLoading(true)
    setError(null)

    const userId = uuidv4()

    try {
      const { error } = await supabase.from('room_members').insert([
        {
          room_id: roomId,
          user_id: userId,
          nickname,
          submitted: false,
          answer_text: null,
        },
      ])
      if (error) throw error

      localStorage.setItem('userId', userId)
localStorage.setItem('nickname', nickname)
router.push(`/room/${roomId}`)

    } catch (err) {
      console.error(err)
      setError('加入房间失败，请检查房间号是否正确。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[color:var(--color-background)] text-[color:var(--color-foreground)] px-4">
      <div className="card w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">加入房间</h1>
        <p className="text-sm text-gray-600">输入房间号，与远方的 TA 一起互动</p>

        <input
          type="text"
          placeholder="房间号"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="text"
          placeholder="你的昵称"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={loading || !roomId || !nickname}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition duration-200 disabled:opacity-50"
        >
          {loading ? '正在加入...' : '加入房间'}
        </button>
      </div>
    </main>
  )
}
