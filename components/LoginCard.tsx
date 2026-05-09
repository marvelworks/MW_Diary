export default function LoginCard() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="login-eyebrow">FAMILY DIARY</p>
        <h1 className="login-title">こうかんにっき</h1>
        <p className="login-copy">
          LINEで本人確認して、投稿があったらLINE公式アカウントから通知を受け取れる交換日記です。
        </p>

        <a href="/api/auth/line/login" className="login-button">
          LINEでログイン
        </a>

        <p className="login-note">
          初回ログイン時に、LINE公式アカウントを友だち追加してください。通知は友だち追加済みのユーザーに送られます。
        </p>
      </section>
    </main>
  )
}
