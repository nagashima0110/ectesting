import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import './LoginPage.css';

function LoginPage({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 簡易的なログイン処理(デモ用)
    if (email === 'test@example.com' && password === 'password') {
      onLogin({
        id: 1,
        email: 'test@example.com',
        name: 'テストユーザー',
        rank: 'general',
        points: 500
      });
    } else {
      setError('メールアドレスまたはパスワードが正しくありません');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <LogIn size={48} className="login-icon" />
          <h2>ログイン</h2>
          <p>ECサイト研修システムにログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            ログイン
          </button>
        </form>

        <div className="login-footer">
          <p>アカウントをお持ちでないですか?</p>
          <button onClick={onRegister} className="register-link">
            新規会員登録
          </button>
        </div>

        <div className="demo-info">
          <h4>デモ用ログイン情報</h4>
          <p>Email: test@example.com</p>
          <p>Password: password</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;