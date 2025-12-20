// ========================================
// API通信サービス
// ========================================

// TODO: 実際のGAS URLに置き換えてください
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyeyUUKWj6XsErlO80CTzXypT9fy6Q8hhCqWel5lMb9mbWlzLCLWhmecxYItoCpfJqwiA/exec';

// 開発用: GAS URLが未設定の場合はモックデータを返す
const USE_MOCK = GAS_API_URL === 'YOUR_GAS_DEPLOYMENT_URL_HERE';

// モックデータ
const mockProducts = [
  { id: 1, name: 'JavaScript入門', price: 2800, stock: 50, category: '書籍', description: 'プログラミング初心者向けの入門書', age_restriction: 0, status: 'available' },
  { id: 2, name: 'Python実践ガイド', price: 3200, stock: 30, category: '書籍', description: 'Pythonの実践的な使い方を学ぶ', age_restriction: 0, status: 'available' },
  { id: 3, name: 'ワイヤレスマウス', price: 1980, stock: 100, category: '電子機器', description: 'Bluetooth対応の静音マウス', age_restriction: 0, status: 'available' },
  { id: 4, name: 'USB-Cケーブル', price: 890, stock: 200, category: '電子機器', description: '高速充電対応 1m', age_restriction: 0, status: 'available' },
  { id: 5, name: 'ノートセット', price: 450, stock: 80, category: '雑貨', description: 'A5サイズ 5冊セット', age_restriction: 0, status: 'available' },
  { id: 6, name: 'ボールペン(黒)', price: 120, stock: 500, category: '雑貨', description: '油性ボールペン 0.7mm', age_restriction: 0, status: 'available' },
  { id: 7, name: 'SQLデータベース設計', price: 3800, stock: 5, category: '書籍', description: 'データベース設計の基礎から応用まで', age_restriction: 0, status: 'available' },
  { id: 8, name: 'Webアプリ開発入門', price: 2980, stock: 0, category: '書籍', description: 'HTML/CSS/JavaScriptでWebアプリを作る', age_restriction: 0, status: 'out_of_stock' },
  { id: 9, name: 'ワイヤレスキーボード', price: 4500, stock: 25, category: '電子機器', description: 'メカニカル式キーボード', age_restriction: 0, status: 'available' },
  { id: 10, name: 'デスクライト', price: 3200, stock: 15, category: '雑貨', description: 'USB給電式 調光機能付き', age_restriction: 0, status: 'available' }
];

let mockCart = [];
let mockOrders = [];

// モック用ユーティリティ
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // 商品一覧取得
  async getProducts(params = {}) {
    if (USE_MOCK) {
      await delay(300);
      let filtered = [...mockProducts];
      
      if (params.category) {
        filtered = filtered.filter(p => p.category === params.category);
      }
      if (params.in_stock === 'true') {
        filtered = filtered.filter(p => p.stock > 0);
      }
      if (params.min_price) {
        filtered = filtered.filter(p => p.price >= Number(params.min_price));
      }
      if (params.max_price) {
        filtered = filtered.filter(p => p.price <= Number(params.max_price));
      }
      
      return { success: true, data: filtered };
    }

    try {
      const queryParams = new URLSearchParams({
        path: 'products',
        method: 'GET',
        ...params
      });
      
      const response = await fetch(`${GAS_API_URL}?${queryParams}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  },

  // 商品詳細取得
  async getProduct(id) {
    if (USE_MOCK) {
      await delay(200);
      const product = mockProducts.find(p => p.id === Number(id));
      return product 
        ? { success: true, data: product }
        : { success: false, error: '商品が見つかりません' };
    }

    try {
      const response = await fetch(
        `${GAS_API_URL}?path=product&method=GET&id=${id}`
      );
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // カート取得
  async getCart(memberId) {
    if (USE_MOCK) {
      await delay(200);
      const enrichedCart = mockCart.map(item => {
        const product = mockProducts.find(p => p.id === item.product_id);
        return { ...item, product };
      });
      return { success: true, data: enrichedCart };
    }

    try {
      const response = await fetch(
        `${GAS_API_URL}?path=cart&method=GET&member_id=${memberId}`
      );
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // カート追加
  async addToCart(memberId, productId, quantity) {
    if (USE_MOCK) {
      await delay(300);
      const product = mockProducts.find(p => p.id === productId);
      
      if (!product) {
        return { success: false, error: '商品が見つかりません' };
      }
      
      if (product.stock < quantity) {
        return { success: false, error: `在庫不足です。在庫数: ${product.stock}` };
      }

      const existingItem = mockCart.find(
        item => item.member_id === memberId && item.product_id === productId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (product.stock < newQuantity) {
          return { success: false, error: `在庫不足です。在庫数: ${product.stock}` };
        }
        existingItem.quantity = newQuantity;
        return { success: true, data: { id: existingItem.id, quantity: newQuantity } };
      }

      const newItem = {
        id: Date.now(),
        member_id: memberId,
        product_id: productId,
        quantity,
        added_at: new Date().toISOString()
      };
      mockCart.push(newItem);
      return { success: true, data: { id: newItem.id } };
    }

    try {
      const response = await fetch(`${GAS_API_URL}?path=cart&method=POST`, {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId, product_id: productId, quantity })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // カート更新
  async updateCartItem(id, quantity) {
    if (USE_MOCK) {
      await delay(200);
      const item = mockCart.find(i => i.id === id);
      if (!item) {
        return { success: false, error: 'カートアイテムが見つかりません' };
      }

      const product = mockProducts.find(p => p.id === item.product_id);
      if (product.stock < quantity) {
        return { success: false, error: '在庫不足です' };
      }

      item.quantity = quantity;
      return { success: true };
    }

    try {
      const response = await fetch(`${GAS_API_URL}?path=cart&method=PUT`, {
        method: 'POST',
        body: JSON.stringify({ id, quantity })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // カート削除
  async deleteCartItem(id) {
    if (USE_MOCK) {
      await delay(200);
      const index = mockCart.findIndex(i => i.id === id);
      if (index === -1) {
        return { success: false, error: 'カートアイテムが見つかりません' };
      }
      mockCart.splice(index, 1);
      return { success: true };
    }

    try {
      const response = await fetch(
        `${GAS_API_URL}?path=cart&method=DELETE&id=${id}`,
        { method: 'POST' }
      );
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 注文作成
  async createOrder(orderData) {
    if (USE_MOCK) {
      await delay(500);
      
      if (mockCart.length === 0) {
        return { success: false, error: 'カートが空です' };
      }

      let totalAmount = 0;
      for (const item of mockCart) {
        const product = mockProducts.find(p => p.id === item.product_id);
        if (product.stock < item.quantity) {
          return { success: false, error: `在庫不足: ${product.name}` };
        }
        totalAmount += product.price * item.quantity;
      }

      const discountAmount = 0; // 簡略化のため割引なし
      const shippingFee = totalAmount >= 5000 ? 0 : 500;

      const orderId = Date.now();
      const order = {
        id: orderId,
        member_id: orderData.member_id,
        status: 'pending',
        total_amount: totalAmount,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        payment_method: orderData.payment_method,
        shipping_method: orderData.shipping_method || 'standard',
        shipping_address: orderData.shipping_address || '',
        created_at: new Date().toISOString(),
        items: mockCart.map(item => {
          const product = mockProducts.find(p => p.id === item.product_id);
          return {
            id: Date.now() + Math.random(),
            order_id: orderId,
            product_id: product.id,
            quantity: item.quantity,
            unit_price: product.price,
            subtotal: product.price * item.quantity,
            product
          };
        })
      };

      // 在庫減算
      mockCart.forEach(item => {
        const product = mockProducts.find(p => p.id === item.product_id);
        product.stock -= item.quantity;
        if (product.stock === 0) {
          product.status = 'out_of_stock';
        }
      });

      mockOrders.push(order);
      mockCart = [];

      return {
        success: true,
        data: {
          order_id: orderId,
          total_amount: totalAmount - discountAmount + shippingFee
        }
      };
    }

    try {
      const response = await fetch(`${GAS_API_URL}?path=orders&method=POST`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 注文履歴取得
  async getOrders(memberId) {
    if (USE_MOCK) {
      await delay(300);
      const userOrders = mockOrders.filter(o => o.member_id === memberId);
      return { success: true, data: userOrders };
    }

    try {
      const response = await fetch(
        `${GAS_API_URL}?path=orders&method=GET&member_id=${memberId}`
      );
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // クーポン検証
  async validateCoupon(code) {
    if (USE_MOCK) {
      await delay(200);
      const mockCoupons = [
        { code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, valid: true },
        { code: 'BOOK500', discount_type: 'fixed', discount_value: 500, valid: true },
      ];

      const coupon = mockCoupons.find(c => c.code === code);
      if (coupon) {
        return { success: true, data: { valid: true, coupon } };
      }
      return { success: true, data: { valid: false, message: 'クーポンコードが無効です' } };
    }

    try {
      const response = await fetch(
        `${GAS_API_URL}?path=coupons&method=GET&code=${code}`
      );
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};