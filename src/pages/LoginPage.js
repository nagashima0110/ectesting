import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { api } from '../services/api';
import './LoginPage.css';

function LoginPage({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await api.login(email, password);

    setLoading(false);
    if (result.success) {
      onLogin(result.data);
    } else {
      setError(result.error || 'ログインに失敗しました');
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

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '処理中...' : 'ログイン'}
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