import React from 'react';
import { Package, Search } from 'lucide-react';
import './ProductListPage.css';

function ProductListPage({ products, loading, filters, setFilters, onAddToCart }) {
  const filteredProducts = products.filter(p => 
    !filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase())
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
              <option value="書籍">書籍</option>
              <option value="電子機器">電子機器</option>
              <option value="雑貨">雑貨</option>
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
                <Package size={48} className="product-icon" />
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category}</p>
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

                  <button
                    onClick={() => onAddToCart(product.id)}
                    disabled={product.stock === 0}
                    className={`add-to-cart-btn ${product.stock === 0 ? 'disabled' : ''}`}
                  >
                    {product.stock === 0 ? '在庫切れ' : 'カートに追加'}
                  </button>
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