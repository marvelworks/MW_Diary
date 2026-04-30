'use client'

import { useState } from 'react'

type Props = {
  currentName: string
  onDone: (name: string) => void
  onCancel: () => void
}

export default function NameSetup({ currentName, onDone, onCancel }: Props) {
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    setLoading(true)
    setError(null)

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: trimmedName }),
    })

    if (!response.ok) {
      setError('表示名の更新に失敗しました。時間をおいてもう一度お試しください。')
      setLoading(false)
      return
    }

    onDone(trimmedName)
    setLoading(false)
  }

  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
      }}
    >
      <h2 style={{ marginTop: 0 }}>表示名の変更</h2>
      <p style={{ color: '#475569', lineHeight: 1.7 }}>
        LINEアカウントで本人確認した上で、このアプリ内で見せる名前だけ変更できます。
      </p>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="例：姪っ子ちゃん"
        style={{
          width: '100%',
          padding: '10px 12px',
          marginBottom: '12px',
          borderRadius: '10px',
          border: '1px solid #cbd5e1',
          background: 'white',
        }}
      />

      {error && (
        <p style={{ margin: '0 0 12px', color: '#b91c1c', fontSize: '14px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={loading || !name.trim()}>
          {loading ? '更新中...' : '保存する'}
        </button>
        <button onClick={onCancel} disabled={loading}>
          キャンセル
        </button>
      </div>
    </div>
  )
}
