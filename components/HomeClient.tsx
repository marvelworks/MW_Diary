'use client'

import { useState } from 'react'
import DiaryForm from '@/components/DiaryForm'
import DiaryList from '@/components/DiaryList'
import NameSetup from '@/components/NameSetup'
import type { CurrentUser } from '@/lib/auth'

export default function HomeClient({ currentUser }: { currentUser: CurrentUser }) {
  const [profile, setProfile] = useState(currentUser)
  const [showNameSetup, setShowNameSetup] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handlePostSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem 1rem 3rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>こうかんにっき</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            {profile.friendshipStatus === 'friend'
              ? 'LINE通知は有効です'
              : 'LINE通知を受けるには公式アカウントを友だち追加してください'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowNameSetup(true)}
            style={{
              fontSize: '14px',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '999px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            表示名を変更
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              fontSize: '14px',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '999px',
              background: 'white',
              cursor: isLoggingOut ? 'wait' : 'pointer',
            }}
          >
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </div>

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

      <p>{profile.name}さん、こんにちは！</p>
      <DiaryForm userName={profile.name} onPostSuccess={handlePostSuccess} />
      <DiaryList userName={profile.name} refreshTrigger={refreshTrigger} />
    </div>
  )
}
