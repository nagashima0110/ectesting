import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import ProductListPage from './pages/ProductListPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import { api } from './services/api';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('products');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ category: '', search: '' });
  
  const MEMBER_ID = 1; // 固定のテストユーザー

  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

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

  const handleAddToCart = async (productId, quantity = 1) => {
    const result = await api.addToCart(MEMBER_ID, productId, quantity);
    if (result.success) {
      alert('カートに追加しました');
      loadCart();
    } else {
      alert('エラー: ' + result.error);
    }
  };

  const handleUpdateCart = async (cartItemId, quantity) => {
    const result = await api.updateCartItem(cartItemId, quantity);
    if (result.success) {
      loadCart();
    } else {
      alert('エラー: ' + result.error);
    }
  };

  const handleRemoveFromCart = async (cartItemId) => {
    if (window.confirm('カートから削除しますか?')) {
      const result = await api.deleteCartItem(cartItemId);
      if (result.success) {
        loadCart();
      }
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
            onSuccess={() => {
              loadCart();
              setCurrentPage('orders');
            }}
          />
        )}
        {currentPage === 'orders' && (
          <OrderHistoryPage memberId={MEMBER_ID} />
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