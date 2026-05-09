'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }
    return window.localStorage.getItem('mw-diary-theme') === 'dark' ? 'dark' : 'light'
  })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-spacer" />
          <h1 className="topbar-title">ここだけのハナシ</h1>
          <div className="profile-menu" ref={menuRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="profile-name">{profile.name}</span>
              <span className="profile-avatar-shell">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.name}のアイコン`}
                    className="profile-avatar-img"
                  />
                ) : (
                  <span className="profile-avatar-fallback">{profile.name.slice(0, 1)}</span>
                )}
              </span>
            </button>

            {menuOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="menu-status">
                  <span className="menu-label">通知設定</span>
                  <strong>
                    {profile.friendshipStatus === 'friend'
                      ? 'LINE通知は有効'
                      : '友だち追加が必要'}
                  </strong>
                </div>

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

                <button
                  className="menu-item-button"
                  onClick={() => {
                    setShowNameSetup(true)
                    setMenuOpen(false)
                  }}
                >
                  表示名を変更する
                </button>

                <button className="menu-item-button is-danger" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-shell app-shell-minimal section-stack">

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

      <section className="minimal-intro">
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            private diary
          </p>
          <h2 className="minimal-heading">{profile.name}さんの交換日記</h2>
          <p className="minimal-copy">
            今日は短くても大丈夫。写真だけでも、ひとことでも、ここだけの話として残していけます。
          </p>
        </div>
      </section>

      <DiaryForm userName={profile.name} onPostSuccess={handlePostSuccess} />
      <DiaryList userName={profile.name} refreshTrigger={refreshTrigger} />
      </main>
    </>
  )
}
