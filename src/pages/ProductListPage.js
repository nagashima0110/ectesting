import React, { useState } from 'react';
import { Package, Search } from 'lucide-react';
import './ProductListPage.css';

function ProductImage({ name }) {
  const [error, setError] = useState(false);

  if (error) {
    return <Package size={48} className="product-icon" />;
  }

  return (
    <img
      src={`${process.env.PUBLIC_URL}/images/${name}.jpg`}
      alt={name}
      className="product-img"
      onError={() => setError(true)}
    />
  );
}

function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  const today = new Date();
  const birth = new Date(birthDateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function ProductListPage({ products, loading, filters, setFilters, onAddToCart, currentUser }) {
  const isLoggedIn = !!currentUser;
  const userAge = calculateAge(currentUser?.birth_date);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const filteredProducts = products.filter(p =>
    (!filters.category || p.category === filters.category) &&
    (!filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase()))
  );

  return (
    <div className="product-list-page">
      <h2 className="page-title">商品一覧</h2>

      {/* フィルター */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="filter-item">
            <label className="filter-label">カテゴリ</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="filter-select"
            >
              <option value="">すべて</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label className="filter-label">
              <Search size={16} />
              検索
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="商品名で検索..."
              className="filter-input"
            />
          </div>
        </div>
        
        <div className="filter-info">
          {filteredProducts.length}件の商品が見つかりました
        </div>
      </div>

      {/* 商品グリッド */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Package size={64} className="empty-icon" />
          <p>商品が見つかりませんでした</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card fade-in">
              <div className="product-image">
                <ProductImage name={product.name} />
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category}</p>
                {product.age_restriction > 0 && (
                  <span className="age-restriction-badge">
                    {product.age_restriction}歳以上
                  </span>
                )}
                <p className="product-description">{product.description}</p>

                <div className="product-footer">
                  <div className="product-price-section">
                    <span className="product-price">
                      ¥{product.price.toLocaleString()}
                    </span>
                    <span className={`stock-badge ${
                      product.stock === 0 ? 'out-of-stock' :
                      product.stock <= 10 ? 'low-stock' :
                      'in-stock'
                    }`}>
                      {product.stock === 0 ? '在庫切れ' :
                       product.stock <= 10 ? `残り${product.stock}個` :
                       '在庫あり'}
                    </span>
                  </div>

                  {(() => {
                    if (product.stock === 0) {
                      return <button disabled className="add-to-cart-btn disabled">在庫切れ</button>;
                    }
                    if (!isLoggedIn) {
                      return <button disabled className="add-to-cart-btn disabled">ログインしてください</button>;
                    }
                    if (product.age_restriction > 0) {
                      if (!currentUser.birth_date) {
                        return <button disabled className="add-to-cart-btn disabled" title="生年月日を登録してください">生年月日未登録</button>;
                      }
                      if (userAge < product.age_restriction) {
                        return <button disabled className="add-to-cart-btn disabled">{product.age_restriction}歳未満は購入不可</button>;
                      }
                    }
                    return (
                      <button
                        onClick={() => onAddToCart(product.id)}
                        className="add-to-cart-btn"
                      >
                        カートに追加
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductListPage;