import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api } from '../services/api';
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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    const result = await api.register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      birth_date: formData.birthDate
    });
    setLoading(false);

    if (result.success) {
      onRegister(result.data);
    } else {
      setError(result.error || '登録に失敗しました');
    }
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

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '処理中...' : '会員登録'}
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