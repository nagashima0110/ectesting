import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Truck, Tag, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import './CheckoutPage.css';

function CheckoutPage({ cart, memberId, currentUser, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState(null);
  const [usePoints, setUsePoints] = useState(0);
  const [processing, setProcessing] = useState(false);
  const prefetchRef = useRef({ code: '', result: null });

  // クーポンコード入力から600ms後にバックグラウンドで先読み
  useEffect(() => {
    if (couponCode.length < 4) {
      prefetchRef.current = { code: '', result: null };
      return;
    }
    const timer = setTimeout(async () => {
      const result = await api.validateCoupon(couponCode);
      prefetchRef.current = { code: couponCode, result };
    }, 600);
    return () => clearTimeout(timer);
  }, [couponCode]);

  const subtotal = cart.reduce((sum, item) =>
    sum + (item.product.price * item.quantity), 0
  );

  // ポイント利用の上限(購入金額の50%まで)
  const maxPoints = Math.min(
    currentUser?.points || 0,
    Math.floor(subtotal * 0.5)
  );

  // 実際に使用するポイント
  const actualUsePoints = Math.min(usePoints, maxPoints);

  // ランク割引
  const rankDiscountRates = { general: 0, gold: 0.05, platinum: 0.10 };
  const rankRate = rankDiscountRates[currentUser?.rank || 'general'] || 0;
  const rankDiscount = Math.floor(subtotal * rankRate);

  // クーポン割引
  let couponDiscount = 0;
  if (couponValid?.valid) {
    const coupon = couponValid.coupon;
    if (coupon.discount_type === 'percentage') {
      couponDiscount = Math.floor(subtotal * (coupon.discount_value / 100));
    } else {
      couponDiscount = Number(coupon.discount_value);
    }
  }

  const discount = actualUsePoints + rankDiscount + couponDiscount;
  const shippingOptionFees = { standard: 0, express: 500, scheduled: 300 };
  const shippingFee = (subtotal >= 5000 ? 0 : 500) + shippingOptionFees[shippingMethod];
  const productPayment = Math.max(0, subtotal - discount);
  const earnedPoints = Math.floor(productPayment * 0.1);
  const total = subtotal - discount + shippingFee;

  const handleValidateCoupon = async () => {
    if (!couponCode) {
      alert('クーポンコードを入力してください');
      return;
    }

    const cached = prefetchRef.current;
    const result = cached.code === couponCode && cached.result
      ? cached.result
      : await api.validateCoupon(couponCode);
    if (!result.success) return;

    if (result.data.valid) {
      const coupon = result.data.coupon;
      const minPurchase = Number(coupon.min_purchase) || 0;
      if (minPurchase > 0 && subtotal < minPurchase) {
        const errData = { valid: false, message: `最低購入金額に達していません（¥${minPurchase.toLocaleString()}以上）` };
        setCouponValid(errData);
        alert(errData.message);
        return;
      }
      setCouponValid(result.data);
      alert('クーポンが適用されました!');
    } else {
      setCouponValid(result.data);
      alert(result.data.message);
    }
  };

  const handleOrder = async () => {
    if (!paymentMethod) {
      alert('支払い方法を選択してください');
      return;
    }

    setProcessing(true);

    const orderData = {
      member_id: memberId,
      payment_method: paymentMethod,
      shipping_method: shippingMethod,
      coupon_code: couponValid?.valid ? couponCode : null,
      use_points: actualUsePoints,
      shipping_address: '東京都渋谷区〇〇1-2-3' // 簡略化のため固定
    };

    const result = await api.createOrder(orderData);
    
    setProcessing(false);

    if (result.success) {
      alert('注文が完了しました!');
      onSuccess({ usedPoints: actualUsePoints, earnedPoints });
    } else {
      alert('エラー: ' + result.error);
    }
  };

  return (
    <div className="checkout-page">
      <h2 className="page-title">お支払い・配送</h2>

      <div className="checkout-layout">
        <div className="checkout-forms">
          {/* 支払い方法 */}
          <div className="checkout-section">
            <h3 className="section-title">
              <CreditCard size={24} />
              支払い方法
            </h3>
            
            <div className="payment-options">
              {[
                { value: 'credit', label: 'クレジットカード', icon: '💳' },
                { value: 'cod', label: '代金引換', icon: '📦' },
                { value: 'convenience', label: 'コンビニ払い', icon: '🏪' },
                { value: 'bank', label: '銀行振込', icon: '🏦' }
              ].map(method => (
                <label key={method.value} className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="option-icon">{method.icon}</span>
                  <span className="option-label">{method.label}</span>
                  {paymentMethod === method.value && (
                    <CheckCircle size={20} className="check-icon" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* 配送方法 */}
          <div className="checkout-section">
            <h3 className="section-title">
              <Truck size={24} />
              配送方法
            </h3>
            
            <div className="shipping-options">
              {[
                { value: 'standard', label: '通常配送', desc: '3-5日でお届け', fee: 0 },
                { value: 'express', label: '速達配送', desc: '1-2日でお届け', fee: 500 },
                { value: 'scheduled', label: '日時指定配送', desc: 'ご希望の日時にお届け', fee: 300 }
              ].map(method => (
                <label key={method.value} className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value={method.value}
                    checked={shippingMethod === method.value}
                    onChange={(e) => setShippingMethod(e.target.value)}
                  />
                  <div className="shipping-info">
                    <div className="shipping-label">{method.label}</div>
                    <div className="shipping-desc">{method.desc}</div>
                  </div>
                  <div className="shipping-fee">
                    {method.fee === 0 ? '無料' : `+¥${method.fee}`}
                  </div>
                  {shippingMethod === method.value && (
                    <CheckCircle size={20} className="check-icon" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* ポイント利用 */}
          <div className="checkout-section">
            <h3 className="section-title">
              <Tag size={24} />
              ポイント利用
            </h3>
            
            <div className="points-info">
              <div className="points-balance">
                <span>保有ポイント</span>
                <span className="points-value">{currentUser?.points || 0}pt</span>
              </div>
              <div className="points-limit">
                ※ 購入金額の50%まで利用可能
              </div>
            </div>

            <div className="points-input-group">
              <input
                type="number"
                value={usePoints}
                onChange={(e) => setUsePoints(Math.max(0, Math.floor(Number(e.target.value))))}
                placeholder="利用ポイント"
                className="points-input"
                min="0"
                max={maxPoints}
                step="1"
              />
              <span className="points-unit">pt</span>
              <button
                onClick={() => setUsePoints(maxPoints)}
                className="use-all-points-btn"
                disabled={maxPoints === 0}
              >
                全て使う
              </button>
            </div>

            {actualUsePoints > 0 && (
              <div className="points-discount">
                <span>ポイント割引</span>
                <span className="discount-value">-¥{actualUsePoints.toLocaleString()}</span>
              </div>
            )}

            {usePoints > maxPoints && (
              <div className="points-warning">
                利用可能ポイントは{maxPoints}ptまでです
              </div>
            )}
          </div>

          {/* クーポン */}
          <div className="checkout-section">
            <h3 className="section-title">
              <Tag size={24} />
              クーポンコード
            </h3>
            
            <div className="coupon-input-group">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="クーポンコードを入力"
                className="coupon-input"
              />
              <button
                onClick={handleValidateCoupon}
                className="coupon-apply-btn"
              >
                適用
              </button>
            </div>
            
            {couponValid && (
              <div className={`coupon-message ${couponValid.valid ? 'success' : 'error'}`}>
                {couponValid.valid ? (
                  <>
                    <CheckCircle size={16} />
                    クーポンが適用されました!
                  </>
                ) : (
                  couponValid.message
                )}
              </div>
            )}
            
            <div className="coupon-examples">
              <p>利用可能なクーポン例:</p>
              <ul>
                <li><code>WELCOME10</code> - 10%割引</li>
                <li><code>BOOK500</code> - 500円割引</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 注文確認 */}
        <div className="order-confirmation-container">
          <div className="order-confirmation">
            <h3 className="confirmation-title">注文内容</h3>
            
            <div className="order-items-list">
              {cart.map(item => (
                <div key={item.id} className="confirmation-item">
                  <span className="item-name">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="item-price">
                    ¥{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="confirmation-divider"></div>

            <div className="confirmation-summary">
              <div className="summary-row">
                <span>小計</span>
                <span>¥{subtotal.toLocaleString()}</span>
              </div>
              
              {actualUsePoints > 0 && (
                <div className="summary-row discount">
                  <span>ポイント割引</span>
                  <span>-¥{actualUsePoints.toLocaleString()}</span>
                </div>
              )}

              {rankDiscount > 0 && (
                <div className="summary-row discount">
                  <span>ランク割引（{currentUser?.rank === 'gold' ? 'ゴールド' : 'プラチナ'}会員 {rankRate * 100}%OFF）</span>
                  <span>-¥{rankDiscount.toLocaleString()}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="summary-row discount">
                  <span>クーポン割引</span>
                  <span>-¥{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="summary-row">
                <span>送料</span>
                <span>¥{shippingFee.toLocaleString()}</span>
              </div>

              <div className="summary-row earned-points">
                <span>購入ポイント付与</span>
                <span>+{earnedPoints.toLocaleString()}pt</span>
              </div>
              
              <div className="confirmation-divider"></div>
              
              <div className="summary-row total">
                <span>合計</span>
                <span className="total-price">¥{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={processing}
              className="confirm-order-btn"
            >
              {processing ? (
                <>
                  <div className="spinner-small"></div>
                  処理中...
                </>
              ) : (
                '注文を確定する'
              )}
            </button>
            
            <div className="order-notice">
              注文確定後、在庫が確保され決済処理が行われます
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;