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
    onPostSuccess?.()
    setLoading(false)
  }

  return (
    <div style={{ margin: '16px 0' }}>
      <p style={{ marginBottom: 8, color: '#475569', fontSize: '14px' }}>
        {userName}さんとして投稿します。
      </p>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="タイトル（任意）"
        style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd', marginBottom: 8 }}
      />

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="今日はどんな一日でしたか？"
        rows={4}
        style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
      />

      <div style={{ marginTop: 8 }}>
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
          style={{ fontSize: '14px', padding: '4px 8px', marginRight: 8 }}
        >
          写真を添付
        </button>
        {imagePreview && (
          <button
            type="button"
            onClick={() => {
              setImageFile(null)
              setImagePreview(null)
            }}
            style={{ fontSize: '14px', padding: '4px 8px', color: '#f00' }}
          >
            削除
          </button>
        )}
      </div>

      {imagePreview && (
        <div style={{ marginTop: 8 }}>
          <img
            src={imagePreview}
            alt="プレビュー"
            style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: 8 }}
          />
        </div>
      )}

      {error && <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error}</p>}

      <button onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
        {loading ? '投稿中...' : '投稿する'}
      </button>
    </div>
  )
}
