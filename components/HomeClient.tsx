'use client'

import { useEffect, useState } from 'react'
import DiaryForm from '@/components/DiaryForm'
import DiaryList from '@/components/DiaryList'
import NameSetup from '@/components/NameSetup'
import type { CurrentUser } from '@/lib/auth'

type ThemeMode = 'light' | 'dark'

export default function HomeClient({ currentUser }: { currentUser: CurrentUser }) {
  const [profile, setProfile] = useState(currentUser)
  const [showNameSetup, setShowNameSetup] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }
    return window.localStorage.getItem('mw-diary-theme') === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const applyTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem('mw-diary-theme', nextTheme)
  }

  const handlePostSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return (
    <main className="app-shell section-stack">
      <section className="hero-card">
        <div className="hero-layout">
          <div>
            <p className="eyebrow">Family Diary</p>
            <h1 className="hero-title">こうかんにっき</h1>
            <p className="hero-copy">
              家族の近況を、やさしく回していくための交換日記です。スマホで書きやすく、あとから読み返しても気持ちが残る見た目に整えています。
            </p>
          </div>

          <div className="section-stack" style={{ minWidth: 'min(100%, 240px)' }}>
            <span className="status-pill">
              {profile.friendshipStatus === 'friend'
                ? 'LINE通知は有効です'
                : 'LINE通知を受けるには公式アカウントを友だち追加してください'}
            </span>
            <div className="theme-switch" role="group" aria-label="テーマ切り替え">
              <button
                type="button"
                className={`theme-option${theme === 'light' ? ' is-selected' : ''}`}
                onClick={() => applyTheme('light')}
              >
                Light
              </button>
              <button
                type="button"
                className={`theme-option${theme === 'dark' ? ' is-selected' : ''}`}
                onClick={() => applyTheme('dark')}
              >
                Dark
              </button>
            </div>
            <div className="hero-actions">
              <button className="ghost-button" onClick={() => setShowNameSetup(true)}>
                表示名を変更
              </button>
              <button className="danger-button" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {showNameSetup && (
        <NameSetup
          currentName={profile.name}
          onCancel={() => setShowNameSetup(false)}
          onDone={(name) => {
            setProfile((prev) => ({ ...prev, name }))
            setShowNameSetup(false)
          }}
        />
      )}

      <section className="greeting-card">
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Welcome Back
          </p>
          <h2 className="greeting-title">{profile.name}さん、こんにちは！</h2>
          <p className="greeting-copy">
            今日のことをひとことでも残しておくと、次の人が返事しやすくなります。写真つきでも、短いメモだけでも大丈夫です。
          </p>
        </div>
        <div className="avatar-badge" aria-hidden="true">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '22px' }}
            />
          ) : (
            profile.name.slice(0, 1)
          )}
        </div>
      </section>

      <DiaryForm userName={profile.name} onPostSuccess={handlePostSuccess} />
      <DiaryList userName={profile.name} refreshTrigger={refreshTrigger} />
    </main>
  )
}
