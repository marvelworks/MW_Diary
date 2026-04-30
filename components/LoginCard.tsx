export default function LoginCard() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: '12px',
            letterSpacing: '0.08em',
            color: '#2563eb',
            fontWeight: 700,
          }}
        >
          FAMILY DIARY
        </p>
        <h1 style={{ margin: '0 0 12px', fontSize: '30px' }}>こうかんにっき</h1>
        <p style={{ margin: '0 0 20px', color: '#475569', lineHeight: 1.7 }}>
          LINEで本人確認して、投稿があったらLINE公式アカウントから通知を受け取れる交換日記です。
        </p>

        <a
          href="/api/auth/line/login"
          style={{
            display: 'inline-flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            borderRadius: '999px',
            background: '#06c755',
            color: 'white',
            padding: '14px 18px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          LINEでログイン
        </a>

        <p style={{ margin: '16px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
          初回ログイン時に、LINE公式アカウントを友だち追加してください。通知は友だち追加済みのユーザーに送られます。
        </p>
      </section>
    </main>
  )
}
