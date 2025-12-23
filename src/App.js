import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, LogIn, UserPlus } from 'lucide-react';
import ProductListPage from './pages/ProductListPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { api } from './services/api';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('products');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [currentUser, setCurrentUser] = useState(null);
  
  // ログイン状態をローカルストレージから復元
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const MEMBER_ID = currentUser?.id || 1; // ログインユーザーのID

  useEffect(() => {
    loadProducts();
    if (currentUser) {
      loadCart();
    }
  }, [currentUser]);

  const loadProducts = async () => {
    setLoading(true);
    const params = {};
    if (filters.category) params.category = filters.category;
    
    const result = await api.getProducts(params);
    if (result.success) {
      setProducts(result.data);
    } else {
      console.error('商品取得エラー:', result.error);
    }
    setLoading(false);
  };

  const loadCart = async () => {
    const result = await api.getCart(MEMBER_ID);
    if (result.success) {
      setCart(result.data);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters.category]);

  // 楽観的UI更新: カート追加
  const handleAddToCart = async (productId, quantity = 1) => {
    // 未ログイン時の処理
    if (!currentUser) {
      if (window.confirm('カートに追加するにはログインが必要です。ログインページに移動しますか?')) {
        setCurrentPage('login');
      }
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // 即座にUI更新
    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      const newItem = {
        id: Date.now(),
        member_id: MEMBER_ID,
        product_id: productId,
        quantity,
        product
      };
      setCart([...cart, newItem]);
    }

    // バックグラウンドでAPI呼び出し
    const result = await api.addToCart(MEMBER_ID, productId, quantity);
    if (!result.success) {
      alert('エラー: ' + result.error);
      loadCart(); // エラー時は再読み込み
    }
  };

  // 楽観的UI更新: カート更新
  const handleUpdateCart = async (cartItemId, quantity) => {
    // 即座にUI更新
    setCart(cart.map(item => 
      item.id === cartItemId ? { ...item, quantity } : item
    ));

    // バックグラウンドでAPI呼び出し
    const result = await api.updateCartItem(cartItemId, quantity);
    if (!result.success) {
      alert('エラー: ' + result.error);
      loadCart();
    }
  };

  // 楽観的UI更新: カート削除
  const handleRemoveFromCart = async (cartItemId) => {
    if (!window.confirm('カートから削除しますか?')) return;

    // 即座にUI更新
    setCart(cart.filter(item => item.id !== cartItemId));

    // バックグラウンドでAPI呼び出し
    const result = await api.deleteCartItem(cartItemId);
    if (!result.success) {
      alert('エラーが発生しました');
      loadCart();
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentPage('products');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCart([]);
    setCurrentPage('products');
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentPage('products');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 未ログイン時の表示
  if (!currentUser && (currentPage === 'cart' || currentPage === 'checkout' || currentPage === 'orders')) {
    return (
      <div className="app">
        <header className="header">
          <div className="container header-content">
            <h1 className="header-title">ECサイト研修システム</h1>
          </div>
        </header>
        <main className="main-content container">
          <div className="login-required">
            <h2>ログインが必要です</h2>
            <p>カート、注文機能を利用するにはログインしてください</p>
            <button onClick={() => setCurrentPage('login')} className="login-btn">
              ログイン
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="header">
        <div className="container header-content">
          <h1 className="header-title">ECサイト研修システム</h1>
          <nav className="header-nav">
            <button
              onClick={() => setCurrentPage('products')}
              className={`nav-button ${currentPage === 'products' ? 'active' : ''}`}
            >
              商品一覧
            </button>
            
            {currentUser ? (
              <>
                <button
                  onClick={() => setCurrentPage('cart')}
                  className={`nav-button ${currentPage === 'cart' ? 'active' : ''}`}
                >
                  <ShoppingCart size={20} />
                  カート
                  {cartItemCount > 0 && (
                    <span className="cart-badge">{cartItemCount}</span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentPage('orders')}
                  className={`nav-button ${currentPage === 'orders' ? 'active' : ''}`}
                >
                  <Package size={20} />
                  注文履歴
                </button>
                <div className="user-info">
                  <span className="user-name">{currentUser.name}</span>
                  <span className="user-points">{currentUser.points || 0}pt</span>
                  <button onClick={handleLogout} className="logout-btn">
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentPage('login')}
                  className={`nav-button ${currentPage === 'login' ? 'active' : ''}`}
                >
                  <LogIn size={20} />
                  ログイン
                </button>
                <button
                  onClick={() => setCurrentPage('register')}
                  className={`nav-button ${currentPage === 'register' ? 'active' : ''}`}
                >
                  <UserPlus size={20} />
                  新規登録
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="main-content container">
        {currentPage === 'products' && (
          <ProductListPage
            products={products}
            loading={loading}
            filters={filters}
            setFilters={setFilters}
            onAddToCart={handleAddToCart}
            isLoggedIn={!!currentUser}
          />
        )}
        {currentPage === 'cart' && (
          <CartPage
            cart={cart}
            onUpdateCart={handleUpdateCart}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckout={() => setCurrentPage('checkout')}
          />
        )}
        {currentPage === 'checkout' && (
          <CheckoutPage
            cart={cart}
            memberId={MEMBER_ID}
            currentUser={currentUser}
            onSuccess={() => {
              loadCart();
              setCurrentPage('orders');
              // ポイント更新
              if (currentUser) {
                const updatedUser = { ...currentUser, points: (currentUser.points || 0) + 100 };
                setCurrentUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              }
            }}
          />
        )}
        {currentPage === 'orders' && (
          <OrderHistoryPage memberId={MEMBER_ID} />
        )}
        {currentPage === 'login' && (
          <LoginPage onLogin={handleLogin} onRegister={() => setCurrentPage('register')} />
        )}
        {currentPage === 'register' && (
          <RegisterPage onRegister={handleRegister} onLogin={() => setCurrentPage('login')} />
        )}
      </main>

      {/* フッター */}
      <footer className="footer">
        <div className="container footer-content">
          <p>ECサイト研修システム - テスト技法学習用</p>
          <p className="footer-note">
            このシステムは研修目的で作成されています
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;