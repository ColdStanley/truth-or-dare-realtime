'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { RealtimeChannel } from '@supabase/supabase-js' // 引入 RealtimeChannel 类型

const RoomInteraction = dynamic(() => import('./components/RoomInteraction'), { ssr: false })

interface Room {
  id: string;
  stage: string;
  current_question: string | null;
  current_asker: string | null;
  // 根据实际 rooms 表添加其他属性
}

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string }
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [userId, setUserId] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // ✅ 频道实例作为状态，确保其生命周期与组件同步
  const [roomChannel, setRoomChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('userId')
      const nick = localStorage.getItem('nickname')

      if (!uid || !nick) {
        if (!redirecting) {
          alert('请先从加入房间页进入');
          setRedirecting(true);
          router.push('/join-room');
        }
        return;
      }

      setUserId(uid);
      setNickname(nick);
      setAuthChecked(true);
    } else {
      setAuthChecked(false);
    }
  }, [router, redirecting]);

  useEffect(() => {
    if (!roomId || roomId.length < 10 || !authChecked || !userId) return;

    const loadData = async () => {
      if (!userId || !nickname) {
         return;
      }

      setLoading(true);
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      
      setRoom(roomData as Room | null)
      setLoading(false)
    }

    loadData()
  }, [roomId, authChecked, userId, nickname])

  // ⚠️ 核心修改：使用 useState 管理频道实例，并在 useEffect 内部创建和订阅
  useEffect(() => {
    // 确保在客户端且有 roomId 时才尝试创建频道
    if (typeof window === 'undefined' || !roomId) {
      // 如果不是客户端或没有 roomId，并且有旧频道，则清理
      if (roomChannel) {
        supabase.removeChannel(roomChannel);
        setRoomChannel(null); // 清理状态
      }
      return;
    }

    // 创建新的频道实例
    const newChannel = supabase.channel(`room-${roomId}`);

    newChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          console.log('[Realtime] room updated:', payload)
          setRoom(payload.new as Room)
        }
      )
      .subscribe(); // 订阅频道

    setRoomChannel(newChannel); // 将新频道实例存储到状态中

    // Cleanup function: 当组件卸载或依赖项变化时，清理旧的频道
    return () => {
      if (newChannel) { // 确保 newChannel 存在
        supabase.removeChannel(newChannel);
        // 注意：这里不需要 setRoomChannel(null)，因为组件即将卸载或 useEffect 将再次运行
      }
    }
  }, [roomId]); // 只有当 roomId 变化时才重新创建和订阅频道

  if (redirecting || loading || !authChecked || !userId || !nickname || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </main>
    )
  }

  return (
    <>
      {(() => {
        try {
          return (
            <main className="min-h-screen flex flex-col items-center justify-start px-6 py-10 bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
              <div className="card w-full max-w-xl text-center space-y-6 mb-10">
                <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">欢迎来到房间</h1>
                <p className="text-sm text-gray-600">房间号：</p>
                <div className="text-lg font-mono bg-white text-gray-900 px-4 py-2 rounded-xl shadow-inner select-all inline-block">
                  {roomId}
                </div>

                <p className="text-md text-purple-700 font-semibold">
                  当前阶段：{room.stage || '未知'}
                </p>

                {room.current_asker ? (
                  <p className="text-sm text-gray-700">
                    当前出题人 ID：<span className="font-mono">{room.current_asker}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">等待出题人...</p>
                )}

                {room.current_question && (
                  <div className="bg-white text-gray-900 rounded-xl p-4 shadow">
                    <p className="font-semibold">当前题目：</p>
                    <p>{room.current_question}</p>
                  </div>
                )}
              </div>

              <div className="w-full max-w-xl">
                <RoomInteraction room={room} userId={userId} nickname={nickname} />
              </div>
            </main>
          )
        } catch (err) {
          console.error('⚠️ 页面渲染失败：', err)
          return <div className="text-red-600 p-4">页面渲染出错，请稍后刷新或联系技术支持。</div>
        }
      })()}
    </>
  )
}