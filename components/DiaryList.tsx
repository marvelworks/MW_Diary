'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Entry = {
  id: string
  author_name: string
  title?: string
  body: string
  image_url?: string
  created_at: string
}

type Like = {
  id: string
  entry_id: string
  user_name: string
  emoji: string
  created_at: string
}

type UserAvatarRow = {
  name: string
  avatar_url: string | null
}

export default function DiaryList({
  userName,
  refreshTrigger,
}: {
  userName: string
  refreshTrigger?: number
}) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [likes, setLikes] = useState<Like[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingBody, setEditingBody] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [customEmoji, setCustomEmoji] = useState('')
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEntries = async () => {
      const { data } = await supabase.from('entries').select('*').order('created_at', { ascending: false })
      if (data) setEntries(data as Entry[])
    }

    const fetchLikes = async () => {
      const { data } = await supabase.from('likes').select('*')
      if (data) setLikes(data as Like[])
    }

    const fetchUserAvatars = async () => {
      const { data } = await supabase.from('users').select('name, avatar_url')
      if (data) {
        const avatarMap: Record<string, string> = {}
        ;(data as UserAvatarRow[]).forEach((user) => {
          if (user.avatar_url) avatarMap[user.name] = user.avatar_url
        })
        setUserAvatars(avatarMap)
      }
    }

    fetchEntries()
    fetchLikes()
    fetchUserAvatars()

    const entriesChannel = supabase
      .channel('entries')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'entries' }, (payload) => {
        setEntries((prev) => [payload.new as Entry, ...prev])
      })
      .subscribe()

    const likesChannel = supabase
      .channel('likes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLikes((prev) => [...prev, payload.new as Like])
        } else if (payload.eventType === 'DELETE') {
          setLikes((prev) => prev.filter((like) => like.id !== payload.old.id))
        }
      })
      .subscribe()

    const usersChannel = supabase
      .channel('users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchUserAvatars)
      .subscribe()

    return () => {
      supabase.removeChannel(entriesChannel)
      supabase.removeChannel(likesChannel)
      supabase.removeChannel(usersChannel)
    }
  }, [])

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      const fetchLatest = async () => {
        const { data } = await supabase.from('entries').select('*').order('created_at', { ascending: false })
        if (data) setEntries(data as Entry[])
      }
      fetchLatest()
    }
  }, [refreshTrigger])

  const startEditing = (entry: Entry) => {
    setEditingId(entry.id)
    setEditingTitle(entry.title || '')
    setEditingBody(entry.body)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingTitle('')
    setEditingBody('')
  }

  const saveEntry = async (id: string) => {
    const trimmedBody = editingBody.trim()
    if (!trimmedBody) return
    setLoadingId(id)
    setError(null)

    const response = await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: editingTitle,
        body: trimmedBody,
      }),
    })

    if (response.ok) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, title: editingTitle.trim() || undefined, body: trimmedBody } : entry
        )
      )
      cancelEditing()
    } else {
      setError('投稿の更新に失敗しました。')
    }

    setLoadingId(null)
  }

  const refreshEntries = async () => {
    const { data } = await supabase.from('entries').select('*').order('created_at', { ascending: false })
    if (data) setEntries(data as Entry[])
  }

  const deleteEntry = async (id: string) => {
    if (!window.confirm('この投稿を削除してもよいですか？')) return
    setLoadingId(id)
    setError(null)

    const response = await fetch(`/api/entries/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
      if (editingId === id) cancelEditing()
    } else {
      setError('投稿の削除に失敗しました。')
    }

    setLoadingId(null)
  }

  const toggleLike = async (entryId: string, emoji: string) => {
    if (!emoji.trim()) return
    setError(null)

    const response = await fetch('/api/likes/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entryId, emoji: emoji.trim() }),
    })

    if (!response.ok) {
      setError('リアクションの更新に失敗しました。')
    }
  }

  return (
    <div>
      {entries.length > 0 && (
        <div
          style={{
            background: '#f0f8ff',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            textAlign: 'center',
            border: '1px solid #e0f0ff',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>次は {entries[0].author_name} さんの番です！</p>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
            最新の投稿: {new Date(entries[0].created_at).toLocaleString('ja-JP')}
          </p>
          <button
            onClick={refreshEntries}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              fontSize: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            最新情報を取得
          </button>
        </div>
      )}

      {error && <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error}</p>}

      {entries.map((entry) => {
        const isOwn = entry.author_name === userName
        const isEditing = editingId === entry.id
        const isLoading = loadingId === entry.id
        const entryLikes = likes.filter((like) => like.entry_id === entry.id)
        const likeCounts = entryLikes.reduce((acc, like) => {
          acc[like.emoji] = (acc[like.emoji] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return (
          <div
            key={entry.id}
            style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, margin: '8px 0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              {userAvatars[entry.author_name] ? (
                <img
                  src={userAvatars[entry.author_name]}
                  alt={`${entry.author_name}のアバター`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    marginRight: '8px',
                    objectFit: 'cover',
                  }}
                />
              ) : null}
              <p style={{ fontWeight: 500, margin: 0 }}>{entry.author_name}</p>
            </div>

            {isEditing ? (
              <>
                <input
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  placeholder="タイトル（任意）"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd', marginBottom: 8 }}
                />
                <textarea
                  value={editingBody}
                  onChange={(event) => setEditingBody(event.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
                />
              </>
            ) : (
              <>
                {entry.title && (
                  <h3 style={{ margin: '8px 0', fontSize: '1.2em', fontWeight: 'bold' }}>{entry.title}</h3>
                )}
                <p>{entry.body}</p>
                {entry.image_url && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={entry.image_url}
                      alt="添付画像"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: 8,
                        border: '1px solid #eee',
                      }}
                    />
                  </div>
                )}
              </>
            )}

            <p style={{ fontSize: 12, color: '#999' }}>{new Date(entry.created_at).toLocaleString('ja-JP')}</p>

            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {['👍', '❤️', '😊', '🎉', '😢', '😮', '🔥', '💯'].map((emoji) => {
                  const count = likeCounts[emoji] || 0
                  const hasLiked = likes.some(
                    (like) => like.entry_id === entry.id && like.user_name === userName && like.emoji === emoji
                  )
                  return (
                    <button
                      key={emoji}
                      onClick={() => toggleLike(entry.id, emoji)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 16,
                        border: hasLiked ? '1px solid #007bff' : '1px solid #ddd',
                        background: hasLiked ? '#e7f3ff' : 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      {emoji} {count > 0 && count}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(event) => setCustomEmoji(event.target.value)}
                  placeholder="絵文字を入力"
                  style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    width: '100px',
                  }}
                  maxLength={2}
                />
                <button
                  onClick={() => {
                    toggleLike(entry.id, customEmoji)
                    setCustomEmoji('')
                  }}
                  disabled={!customEmoji.trim()}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    background: 'white',
                    cursor: customEmoji.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                  }}
                >
                  追加
                </button>
              </div>

              {Object.entries(likeCounts)
                .filter(([emoji]) => !['👍', '❤️', '😊', '🎉', '😢', '😮', '🔥', '💯'].includes(emoji))
                .map(([emoji, count]) => {
                  const hasLiked = likes.some(
                    (like) => like.entry_id === entry.id && like.user_name === userName && like.emoji === emoji
                  )
                  return (
                    <button
                      key={emoji}
                      onClick={() => toggleLike(entry.id, emoji)}
                      style={{
                        margin: '2px',
                        padding: '2px 6px',
                        borderRadius: 12,
                        border: hasLiked ? '1px solid #007bff' : '1px solid #ddd',
                        background: hasLiked ? '#e7f3ff' : 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {emoji} {count}
                    </button>
                  )
                })}
            </div>

            {isOwn && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {isEditing ? (
                  <>
                    <button onClick={() => saveEntry(entry.id)} disabled={isLoading}>
                      {isLoading ? '保存中...' : '保存'}
                    </button>
                    <button onClick={cancelEditing} disabled={isLoading}>
                      キャンセル
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(entry)} disabled={isLoading}>
                      編集
                    </button>
                    <button onClick={() => deleteEntry(entry.id)} disabled={isLoading}>
                      削除
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
