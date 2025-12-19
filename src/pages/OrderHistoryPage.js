import React, { useState, useEffect } from 'react';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';
import './OrderHistoryPage.css';

function OrderHistoryPage({ memberId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const result = await api.getOrders(memberId);
    if (result.success) {
      setOrders(result.data);
    }
    setLoading(false);
  };

  const toggleOrderExpand = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const statusLabels = {
    pending: { label: '注文受付', color: 'blue' },
    paid: { label: '支払済み', color: 'green' },
    preparing: { label: '準備中', color: 'yellow' },
    shipped: { label: '発送済み', color: 'purple' },
    delivering: { label: '配送中', color: 'indigo' },
    delivered: { label: '配達完了', color: 'teal' },
    completed: { label: '確定', color: 'gray' },
    cancelled: { label: 'キャンセル', color: 'red' }
  };

  if (loading) {
    return (
      <div className="order-history-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-page">
        <h2 className="page-title">注文履歴</h2>
        <div className="empty-orders">
          <Package size={80} className="empty-icon" />
          <h3>注文履歴はありません</h3>
          <p>商品を購入すると、ここに表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <h2 className="page-title">注文履歴</h2>

      <div className="orders-list">
        {orders.map(order => {
          const status = statusLabels[order.status] || { label: order.status, color: 'gray' };
          const isExpanded = expandedOrders.has(order.id);
          const finalAmount = order.total_amount - order.discount_amount + order.shipping_fee;

          return (
            <div key={order.id} className="order-card fade-in">
              <div className="order-header">
                <div className="order-header-left">
                  <h3 className="order-id">注文 #{order.id}</h3>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="order-header-right">
                  <span className={`status-badge status-${status.color}`}>
                    {status.label}
                  </span>
                  <button
                    onClick={() => toggleOrderExpand(order.id)}
                    className="expand-btn"
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="order-details">
                  <div className="order-items">
                    <h4 className="details-title">注文内容</h4>
                    {order.items?.map(item => (
                      <div key={item.id} className="order-item">
                        <div className="order-item-info">
                          <span className="order-item-name">
                            {item.product?.name || '商品情報なし'}
                          </span>
                          <span className="order-item-quantity">
                            × {item.quantity}
                          </span>
                        </div>
                        <span className="order-item-price">
                          ¥{item.subtotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary-detail">
                    <div className="summary-row">
                      <span>小計</span>
                      <span>¥{order.total_amount.toLocaleString()}</span>
                    </div>
                    
                    {order.discount_amount > 0 && (
                      <div className="summary-row discount">
                        <span>割引</span>
                        <span>-¥{order.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="summary-row">
                      <span>送料</span>
                      <span>¥{order.shipping_fee}</span>
                    </div>
                    
                    <div className="summary-divider"></div>
                    
                    <div className="summary-row total">
                      <span>合計</span>
                      <span className="total-amount">
                        ¥{finalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="order-info-grid">
                    <div className="info-item">
                      <span className="info-label">支払方法</span>
                      <span className="info-value">
                        {order.payment_method === 'credit' ? 'クレジットカード' :
                         order.payment_method === 'cod' ? '代金引換' :
                         order.payment_method === 'convenience' ? 'コンビニ払い' :
                         order.payment_method === 'bank' ? '銀行振込' :
                         order.payment_method}
                      </span>
                    </div>
                    
                    <div className="info-item">
                      <span className="info-label">配送方法</span>
                      <span className="info-value">
                        {order.shipping_method === 'standard' ? '通常配送' :
                         order.shipping_method === 'express' ? '速達配送' :
                         order.shipping_method === 'scheduled' ? '日時指定配送' :
                         order.shipping_method}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!isExpanded && (
                <div className="order-summary">
                  <div className="order-summary-items">
                    {order.items?.slice(0, 2).map((item, index) => (
                      <span key={index} className="summary-item-name">
                        {item.product?.name}
                        {index < Math.min(1, order.items.length - 1) && ', '}
                      </span>
                    ))}
                    {order.items?.length > 2 && (
                      <span className="summary-more">
                        他{order.items.length - 2}点
                      </span>
                    )}
                  </div>
                  
                  <div className="order-total">
                    合計: <span className="total-amount">¥{finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderHistoryPage;