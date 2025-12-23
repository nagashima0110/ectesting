import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import './RegisterPage.css';

function RegisterPage({ onRegister, onLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    // 新規ユーザー作成(デモ用)
    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      birth_date: formData.birthDate,
      rank: 'general',
      points: 0,
      status: 'active'
    };

    onRegister(newUser);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <UserPlus size={48} className="register-icon" />
          <h2>新規会員登録</h2>
          <p>アカウントを作成してショッピングを始めましょう</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>お名前 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="山田 太郎"
              required
            />
          </div>

          <div className="form-group">
            <label>メールアドレス *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>生年月日</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>パスワード * (6文字以上)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>パスワード(確認) *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="welcome-bonus">
            <span className="bonus-icon">🎁</span>
            <div>
              <strong>新規登録特典</strong>
              <p>会員登録で100ポイントプレゼント!</p>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            会員登録
          </button>
        </form>

        <div className="register-footer">
          <p>すでにアカウントをお持ちですか?</p>
          <button onClick={onLogin} className="login-link">
            ログイン
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;