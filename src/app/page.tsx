'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-12 bg-[color:var(--color-background)] text-[color:var(--color-foreground)] space-y-16">
      {/* 上方三列区 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-screen-xl mx-auto">
        {/* 左列：标题 */}
        <div className="flex flex-col justify-start">
          <h1 className="text-4xl font-bold text-[color:var(--color-primary)] mb-3">Truth or Dare Mini</h1>
          <p className="text-lg">与远方的 TA 同步互动，共享时刻</p>
        </div>

        {/* 中列：游戏说明 */}
        <div className="card text-sm leading-relaxed flex flex-col gap-2">
          <h3 className="text-lg font-bold text-[color:var(--color-primary)] mb-2">游戏说明</h3>
          <p>1. 创建或加入房间，即可开始互动。</p>
          <p>2. 每轮由一方选择题目，另一方作答。</p>
          <p>3. 双方提交后将自动同步展示答案。</p>
          <p>4. 下一轮轮换出题者，持续互动。</p>
          <p className="mt-2 text-gray-500">支持 Truth/Dare 自动题库和自定义输入。</p>
        </div>

        {/* 右列：项目更新 */}
        <div className="card text-sm leading-relaxed">
          <h3 className="text-lg font-bold text-[color:var(--color-primary)] mb-2">项目更新</h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>✔️ Tailwind v4 + CSS-first 已配置</li>
            <li>✔️ 页面结构采用三列栅格</li>
            <li>🔜 正在开发房间功能</li>
          </ul>
        </div>
      </div>

      {/* 下方按钮卡片两列区 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-screen-md mx-auto">
        {/* 创建房间 */}
        <div className="card flex flex-col items-center text-center space-y-2 pb-4">
          <p className="text-sm text-gray-600">生成唯一房间号，与 TA 开启互动</p>
          <Link
            href="/create-room"
            className="mt-2 bg-[color:var(--color-primary)] text-white text-sm font-medium px-6 py-1.5 rounded-2xl shadow hover:bg-purple-600 hover:shadow-md transition"
          >
            创建房间
          </Link>
        </div>

        {/* 加入房间 */}
        <div className="card flex flex-col items-center text-center space-y-2 pb-4">
          <p className="text-sm text-gray-600">输入房间号，进入 TA 的房间</p>
          <Link
            href="/join-room"
            className="mt-2 bg-[color:var(--color-primary)] text-white text-sm font-medium px-6 py-1.5 rounded-2xl shadow hover:bg-purple-600 hover:shadow-md transition"
          >
            加入房间
          </Link>
        </div>
      </div>
    </main>
  )
}
