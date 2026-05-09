'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DiaryForm({
  userName,
  onPostSuccess,
}: {
  userName: string
  onPostSuccess?: () => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (readerEvent) => setImagePreview(readerEvent.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!body.trim()) return
    setLoading(true)
    setError(null)

    let imageUrl = null
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data, error: uploadError } = await supabase.storage
        .from('diary-images')
        .upload(fileName, imageFile)

      if (uploadError) {
        setError('画像のアップロードに失敗しました。')
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('diary-images').getPublicUrl(data.path)
      imageUrl = urlData.publicUrl
    }

    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        imageUrl,
      }),
    })

    if (!response.ok) {
      setError('投稿に失敗しました。ログイン状態や設定を確認してください。')
      setLoading(false)
      return
    }

    setTitle('')
    setBody('')
    setImageFile(null)
    setImagePreview(null)
    setPreviewOpen(false)
    onPostSuccess?.()
    setLoading(false)
  }

  return (
    <section className="surface-card">
      <div className="composer-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            New Entry
          </p>
          <h2 className="section-title">今日の日記を書く</h2>
          <p className="section-copy">
            {userName}さんとして投稿します。タイトルはなくても大丈夫です。本文が主役なので、気軽に書いてください。
          </p>
        </div>
        <span className="tag-pill">スマホでも入力しやすい大きめUI</span>
      </div>

      <div className="section-stack">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="タイトルをつけるならここ"
        />

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="今日はどんな一日でしたか？ ひとことでも大丈夫。"
          rows={6}
        />
      </div>

      <div className="toolbar-row" style={{ marginTop: 14 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="ghost-button"
        >
          写真を添付する
        </button>
        {imagePreview && (
          <button
            type="button"
            onClick={() => {
              setImageFile(null)
              setImagePreview(null)
            }}
            className="danger-button"
          >
            添付を外す
          </button>
        )}
      </div>

      {imagePreview && (
        <>
          <div className="file-preview-card">
            <button
              type="button"
              className="image-button"
              onClick={() => setPreviewOpen(true)}
              aria-label="添付画像を拡大表示"
            >
              <div className="file-preview">
                <img src={imagePreview} alt="プレビュー" />
              </div>
            </button>
            <p className="image-caption">タップして全体を見る</p>
          </div>

          {previewOpen && (
            <div
              className="image-modal-backdrop"
              role="dialog"
              aria-modal="true"
              onClick={() => setPreviewOpen(false)}
            >
              <button
                type="button"
                className="image-modal-close"
                onClick={() => setPreviewOpen(false)}
                aria-label="画像モーダルを閉じる"
              >
                ×
              </button>
              <div
                className="image-modal-content"
                onClick={(event) => event.stopPropagation()}
              >
                <img src={imagePreview} alt="プレビュー拡大" className="image-modal-img" />
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="message-error" style={{ marginTop: 12 }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="primary-button"
        style={{ marginTop: 18, width: '100%', minHeight: 54, fontSize: '16px' }}
      >
        {loading ? '投稿中...' : '✍️ 日記を投稿する'}
      </button>
    </section>
  )
}
