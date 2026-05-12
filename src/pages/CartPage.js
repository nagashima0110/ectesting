import React, { useState } from 'react';
import { ShoppingCart, Package, Minus, Plus, Trash2 } from 'lucide-react';
import './CartPage.css';

function ProductImage({ name }) {
  const [error, setError] = useState(false);
  if (error) {
    return <Package size={40} className="cart-item-icon" />;
  }
  return (
    <img
      src={`${process.env.PUBLIC_URL}/images/${name}.jpg`}
      alt={name}
      className="cart-item-img"
      onError={() => setError(true)}
    />
  );
}

function CartPage({ cart, onUpdateCart, onRemoveFromCart, onCheckout }) {
  // カートが空の場合は早期リターン
  if (!cart || cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <ShoppingCart size={80} className="empty-cart-icon" />
          <h2>カートは空です</h2>
          <p>商品を追加してください</p>
        </div>
      </div>
    );
  }

  // カート計算
  const subtotal = cart.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );
  const shippingFee = subtotal >= 5000 ? 0 : 500;
  const total = subtotal + shippingFee;

  return (
    <div className="cart-page">
      <h2 className="page-title">ショッピングカート</h2>

      <div className="cart-layout">
        {/* カート内容 */}
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item fade-in">
              <div className="cart-item-image">
                <ProductImage name={item.product.name} />
              </div>
              
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.product.name}</h3>
                <p className="cart-item-category">{item.product.category}</p>
                <p className="cart-item-price">
                  ¥{item.product.price.toLocaleString()}
                </p>
              </div>

              <div className="cart-item-actions">
                <div className="quantity-control">
                  <button
                    onClick={() => onUpdateCart(item.id, Math.max(1, item.quantity - 1))}
                    className="quantity-btn"
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-display">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateCart(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="quantity-btn"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="cart-item-subtotal">
                  ¥{(item.product.price * item.quantity).toLocaleString()}
                </div>
                
                <button
                  onClick={() => onRemoveFromCart(item.id)}
                  className="remove-btn"
                  title="削除"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 注文サマリー */}
        <div className="order-summary-container">
          <div className="order-summary">
            <h3 className="summary-title">注文サマリー</h3>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>小計</span>
                <span>¥{subtotal.toLocaleString()}</span>
              </div>
              
              <div className="summary-row">
                <span>送料</span>
                <span className={shippingFee === 0 ? 'free-shipping' : ''}>
                  {shippingFee === 0 ? '無料' : `¥${shippingFee}`}
                </span>
              </div>
              
              {subtotal < 5000 && (
                <div className="shipping-notice">
                  あと¥{(5000 - subtotal).toLocaleString()}で送料無料
                </div>
              )}
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total-row">
                <span>合計</span>
                <span className="total-amount">¥{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="checkout-btn"
            >
              レジに進む
            </button>
            
            <div className="security-notice">
              <span>🔒</span>
              安全な決済
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;