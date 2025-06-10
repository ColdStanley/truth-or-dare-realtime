'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js' // 引入 RealtimeChannel 类型

// 定义成员接口
interface Member {
  user_id: string;
  nickname: string | null;
  submitted: boolean;
  answer_text: string | null;
}

// 定义房间接口
interface Room {
  id: string;
  stage: string;
  current_question: string | null;
  current_asker: string | null;
}

interface Props {
  room: Room;
  userId: string;
  nickname: string;
}

export default function RoomInteraction({ room, userId, nickname }: Props) {
  const [questionInput, setQuestionInput] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [countdown, setCountdown] = useState(5)

  const [currentStage, setCurrentStage] = useState(room.stage)

  const isAsker = room.current_asker === userId

  // ✅ 频道实例作为状态
  const [memberChannel, setMemberChannel] = useState<RealtimeChannel | null>(null);
  const [interactionRoomChannel, setInteractionRoomChannel] = useState<RealtimeChannel | null>(null);


  const handleReset = useCallback(async () => {
    const currentIndex = members.findIndex(m => m.user_id === room.current_asker)
    const nextAsker = members[(currentIndex + 1) % members.length]?.user_id

    await Promise.all([
      supabase.from('rooms').update({
        current_question: null,
        current_asker: nextAsker,
        stage: 'choosing'
      }).eq('id', room.id),

      supabase.from('room_members').update({
        submitted: false,
        answer_text: null
      }).eq('room_id', room.id)
    ])
  }, [members, room.current_asker, room.id]);

  // 监听 room_members 表，获取提交状态
  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
      setMembers(data || [])

      const current = data?.find((m) => m.user_id === userId)
      setSubmitted(!!current?.submitted)
    }

    fetchMembers()

    // ⚠️ 核心修改：使用 useState 管理 memberChannel
    if (typeof window === 'undefined' || !room?.id) {
      if (memberChannel) {
        supabase.removeChannel(memberChannel);
        setMemberChannel(null);
      }
      return;
    }

    // 创建新的频道实例
    const newMemberChannel = supabase.channel(`room-members-${room.id}`);

    newMemberChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${room.id}` },
      () => fetchMembers()
    )
    .subscribe();

    setMemberChannel(newMemberChannel);

    return () => {
      if (newMemberChannel) {
        supabase.removeChannel(newMemberChannel);
      }
    }
  }, [room.id, userId]); // 依赖项不变

  // 检查是否所有人提交，自动进入 revealing 阶段
  useEffect(() => {
    if (currentStage === 'answering' && members.length > 0) {
      const allSubmitted = members.every((m) => m.submitted)
      if (allSubmitted) {
        setTimeout(() => {
          supabase
            .from('rooms')
            .update({ stage: 'revealing' })
            .eq('id', room.id)
        }, 300)
      }
    }
  }, [members, currentStage, room.id])

  // 监听 rooms 表，实时同步 stage 和 question
  useEffect(() => {
    if (typeof window === 'undefined' || !room?.id) {
      if (interactionRoomChannel) {
        supabase.removeChannel(interactionRoomChannel);
        setInteractionRoomChannel(null);
      }
      return;
    }

    // ⚠️ 核心修改：使用 useState 管理 interactionRoomChannel
    const newInteractionRoomChannel = supabase.channel(`room-${room.id}`);

    newInteractionRoomChannel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
      (payload) => {
        const updated = payload.new
        setCurrentStage(updated.stage)
      }
    )
    .subscribe();

    setInteractionRoomChannel(newInteractionRoomChannel);

    return () => {
      if (newInteractionRoomChannel) {
        supabase.removeChannel(newInteractionRoomChannel);
      }
    }
  }, [room.id]) // 依赖项不变

  // 进入 revealing 阶段后开始倒计时
  useEffect(() => {
    if (currentStage === 'revealing') {
      setCountdown(5)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            handleReset()
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [currentStage, handleReset])

  const handleSubmitQuestion = async () => {
    if (!questionInput) return
    setLoading(true)
    await supabase.from('rooms').update({
      current_question: questionInput,
      stage: 'answering'
    }).eq('id', room.id)
    setLoading(false)
  }

  const handleSubmitAnswer = async () => {
    if (!answerInput || submitted) return
    setLoading(true)
    await supabase.from('room_members').update({
      answer_text: answerInput,
      submitted: true
    }).eq('room_id', room.id).eq('user_id', userId)
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="w-full space-y-6">
      <p className="text-md font-semibold text-gray-700">你是：{nickname}</p>
      <p className="text-sm text-gray-500">当前阶段：{currentStage}</p>

      <div className="bg-white rounded-md p-4 shadow">
        <p className="text-sm font-semibold mb-2">成员提交状态：</p>
        <ul className="space-y-1 text-left">
          {members.map((m) => (
            <li key={m.user_id} className="text-sm">
              {m.nickname || m.user_id.slice(0, 6)} - {m.submitted ? '✅ 已提交' : '⏳ 未提交'}
            </li>
          ))}
        </ul>
      </div>

      {currentStage === 'choosing' && isAsker && (
        <div className="space-y-2">
          <textarea
            placeholder="输入你要出的题目..."
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleSubmitQuestion}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-full disabled:opacity-50"
          >
            提交题目
          </button>
        </div>
      )}

      {currentStage === 'answering' && (
        <div className="space-y-2">
          {room.current_question && (
            <p className="font-medium text-gray-700">题目：{room.current_question}</p>
          )}

          <textarea
            placeholder="输入你的回答..."
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            disabled={submitted}
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={loading || submitted}
            className="bg-purple-600 text-white px-4 py-2 rounded-full disabled:opacity-50"
          >
            {submitted ? '已提交' : loading ? '提交中...' : '提交回答'}
          </button>
        </div>
      )}

      {currentStage === 'revealing' && (
        <div className="bg-yellow-100 p-4 rounded-md shadow text-sm space-y-2">
          <p className="font-semibold">展示答案中...（倒计时 {countdown} 秒）</p>
          <ul className="text-left">
            {members.map((m) => (
              <li key={m.user_id}>
                {m.nickname || m.user_id.slice(0, 6)}：{m.answer_text || '（无回答）'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}