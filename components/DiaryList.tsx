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
  const [activeReactionEntryId, setActiveReactionEntryId] = useState<string | null>(null)
  const [customEmojiByEntry, setCustomEmojiByEntry] = useState<Record<string, string>>({})
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)
  const quickReactions = ['👍', '❤️', '😊', '🎉', '😢', '😮', '🔥', '💯']

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
      return
    }

    const result = (await response.json()) as { liked?: boolean }
    const normalizedEmoji = emoji.trim()

    setLikes((prev) => {
      const withoutTarget = prev.filter(
        (like) =>
          !(
            like.entry_id === entryId &&
            like.user_name === userName &&
            like.emoji === normalizedEmoji
          )
      )

      if (!result.liked) {
        return withoutTarget
      }

      return [
        ...withoutTarget,
        {
          id: `local-${entryId}-${normalizedEmoji}-${userName}`,
          entry_id: entryId,
          user_name: userName,
          emoji: normalizedEmoji,
          created_at: new Date().toISOString(),
        },
      ]
    })
  }

  const customEmoji = (entryId: string) => customEmojiByEntry[entryId] ?? ''

  const setCustomEmoji = (entryId: string, value: string) => {
    setCustomEmojiByEntry((prev) => ({ ...prev, [entryId]: value }))
  }

  return (
    <section className="section-stack">
      {entries.length > 0 && (
        <div className="turn-card">
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              Next Turn
            </p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>
              次は {entries[0].author_name} さんの番です！
            </p>
            <p className="section-copy" style={{ marginTop: 6 }}>
              最新の投稿: {new Date(entries[0].created_at).toLocaleString('ja-JP')}
            </p>
          </div>
          <button onClick={refreshEntries} className="ghost-button">
            最新情報を取得
          </button>
        </div>
      )}

      {error && <p className="message-error">{error}</p>}

      <div className="list-heading">
        <h2 className="section-title">TIMELINE</h2>
      </div>

      <div className="entry-list">
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
            <article key={entry.id} className="entry-card">
              <div className="entry-header">
                <div className="entry-author">
                  {userAvatars[entry.author_name] ? (
                    <img
                      src={userAvatars[entry.author_name]}
                      alt={`${entry.author_name}のアバター`}
                      className="entry-avatar"
                    />
                  ) : (
                    <div className="avatar-badge" style={{ width: 44, height: 44, borderRadius: 16, fontSize: 16 }}>
                      {entry.author_name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 700, margin: 0 }}>{entry.author_name}</p>
                    <p className="entry-meta">{new Date(entry.created_at).toLocaleString('ja-JP')}</p>
                  </div>
                </div>

                {isOwn ? <span className="tag-pill">あなたの投稿</span> : null}
              </div>

              {isEditing ? (
                <div className="section-stack">
                  <input
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    placeholder="タイトル（任意）"
                  />
                  <textarea value={editingBody} onChange={(event) => setEditingBody(event.target.value)} rows={5} />
                </div>
              ) : (
                <>
                  {entry.title && <h3 className="entry-title">{entry.title}</h3>}
                  <p className="entry-body">{entry.body}</p>
                  {entry.image_url && (
                    <div className="entry-image-card">
                      <button
                        type="button"
                        className="image-button"
                        onClick={() => setModalImageUrl(entry.image_url!)}
                        aria-label="投稿画像を拡大表示"
                      >
                        <img src={entry.image_url} alt="添付画像" className="entry-image" />
                      </button>
                      <p className="image-caption">タップして拡大</p>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginTop: 18 }}>
                <div className="reaction-row">
                  {Object.entries(likeCounts).map(([emoji, count]) => {
                    const hasLiked = likes.some(
                      (like) => like.entry_id === entry.id && like.user_name === userName && like.emoji === emoji
                    )
                    return (
                      <button
                        key={emoji}
                        onClick={() => toggleLike(entry.id, emoji)}
                        className={`reaction-chip${hasLiked ? ' is-active' : ''}`}
                      >
                        <span>{emoji}</span>
                        <span>{count}</span>
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      setActiveReactionEntryId((prev) => (prev === entry.id ? null : entry.id))
                    }
                    aria-label="リアクションを追加"
                    title="リアクションを追加"
                  >
                    +
                  </button>
                </div>

                {activeReactionEntryId === entry.id && (
                  <div className="reaction-panel">
                    <div>
                      <p className="eyebrow" style={{ marginBottom: 8 }}>
                        Add Reaction
                      </p>
                      <div className="reaction-grid">
                        {quickReactions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="reaction-chip"
                            onClick={() => {
                              toggleLike(entry.id, emoji)
                              setActiveReactionEntryId(null)
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="toolbar-row">
                      <input
                        type="text"
                        value={customEmoji(entry.id)}
                        onChange={(event) => setCustomEmoji(entry.id, event.target.value)}
                        placeholder="好きな絵文字を入力"
                        maxLength={2}
                      />
                      <button
                        className="primary-button"
                        onClick={() => {
                          toggleLike(entry.id, customEmoji(entry.id))
                          setCustomEmoji(entry.id, '')
                          setActiveReactionEntryId(null)
                        }}
                        disabled={!customEmoji(entry.id).trim()}
                      >
                        追加
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isOwn && (
                <div className="entry-actions">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEntry(entry.id)} disabled={isLoading} className="primary-button">
                        {isLoading ? '保存中...' : '保存する'}
                      </button>
                      <button onClick={cancelEditing} disabled={isLoading} className="ghost-button">
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(entry)} disabled={isLoading} className="ghost-button">
                        編集する
                      </button>
                      <button onClick={() => deleteEntry(entry.id)} disabled={isLoading} className="danger-button">
                        削除する
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {modalImageUrl && (
        <div
          className="image-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalImageUrl(null)}
        >
          <button
            type="button"
            className="image-modal-close"
            onClick={() => setModalImageUrl(null)}
            aria-label="画像モーダルを閉じる"
          >
            ×
          </button>
          <div className="image-modal-content" onClick={(event) => event.stopPropagation()}>
            <img src={modalImageUrl} alt="投稿画像拡大" className="image-modal-img" />
          </div>
        </div>
      )}
    </section>
  )
}
