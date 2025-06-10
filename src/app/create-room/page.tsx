'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'


export default function CreateRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateRoom = async () => {
  setLoading(true)
  setError(null)
  const roomId = uuidv4()
  const userId = roomId // 用 roomId 作为房主 ID
  const nickname = '房主'

  try {
    // 创建房间
    await supabase.from('rooms').insert({
      id: roomId,
      current_asker: userId,
      stage: 'choosing'
    })

    // 添加房主为房间成员
    await supabase.from('room_members').insert({
      room_id: roomId,
      user_id: userId,
      nickname: nickname,
      submitted: false
    })

    // 存储到 localStorage
    localStorage.setItem('userId', userId)
    localStorage.setItem('nickname', nickname)

    router.push(`/room/${roomId}`)
  } catch (err) {
    console.error('房间创建失败:', err)
    setError('房间创建失败，请稍后再试。')
  } finally {
    setLoading(false)
  }
}


  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-purple-100 p-8 rounded-2xl shadow-md w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-bold text-purple-700">创建 Truth or Dare 房间</h1>
        <p className="text-sm text-gray-600">点击按钮后将自动生成房间号并跳转</p>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition duration-200 disabled:opacity-50"
        >
          {loading ? '正在创建...' : '创建房间'}
        </button>
      </div>
    </main>
  )
}
