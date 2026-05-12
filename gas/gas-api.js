// ========================================
// 自動ステータス更新(30分ごとに実行)
// ========================================

function autoUpdateOrderStatus() {
  const sheet = getSheet('orders');
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  const statusFlow = {
    'pending': { next: 'paid', minutes: 30 },
    'paid': { next: 'preparing', minutes: 30 },
    'preparing': { next: 'shipped', minutes: 30 },
    'shipped': { next: 'delivering', minutes: 30 },
    'delivering': { next: 'delivered', minutes: 30 },
    'delivered': { next: 'completed', minutes: 30 }
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const orderId = row[0];
    const currentStatus = row[2];
    const updatedAt = new Date(row[10]);

    if (currentStatus === 'cancelled' || currentStatus === 'completed') continue;

    const rule = statusFlow[currentStatus];
    if (!rule) continue;

    const elapsedMinutes = (now - updatedAt) / (1000 * 60);

    if (elapsedMinutes >= rule.minutes) {
      sheet.getRange(i + 1, 3).setValue(rule.next);
      sheet.getRange(i + 1, 11).setValue(now.toISOString());
      Logger.log(`Order ${orderId}: ${currentStatus} → ${rule.next}`);
    }
  }

  return { success: true, message: 'ステータス更新完了' };
}

// ========================================
// ECサイト研修用 Google Apps Script API
// ========================================

const SPREADSHEET_ID = '1ms0d8ecGTGhAKZkxV_P6GeoEMyRKCuBtd8xiTIcBG20';

// ========================================
// メインハンドラー
// ========================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  if (e.parameter.method === 'OPTIONS') {
    return ContentService
      .createTextOutput('')
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const path = e.parameter.path || '';
    const method = e.parameter.method || 'GET';
    let result;

    switch(path) {
      case 'products':
        if (method === 'GET') {
          result = getProducts(e.parameter);
        } else if (method === 'POST') {
          result = createProduct(e.parameter);
        }
        break;

      case 'product':
        result = getProductById(e.parameter.id);
        break;

      case 'cart':
        if (method === 'GET') {
          result = getCart(e.parameter.member_id);
        } else if (method === 'POST') {
          result = addToCart(e.parameter);
        } else if (method === 'PUT') {
          result = updateCartItem(e.parameter);
        } else if (method === 'DELETE') {
          result = deleteCartItem(e.parameter.id);
        }
        break;

      case 'orders':
        if (method === 'GET') {
          result = getOrders(e.parameter.member_id);
        } else if (method === 'POST') {
          result = createOrder(e.parameter);
        }
        break;

      case 'order':
        result = getOrderById(e.parameter.id);
        break;

      case 'members':
        if (method === 'GET') {
          if (e.parameter.action === 'register') {
            result = createMember({
              email: e.parameter.email,
              password: e.parameter.password,
              name: e.parameter.name,
              birth_date: e.parameter.birth_date
            });
          } else {
            result = getMemberByEmail(e.parameter.email, e.parameter.password);
          }
        }
        break;

      case 'coupons':
        result = validateCoupon(e.parameter.code);
        break;

      case 'cancel-order':
        result = cancelOrder(e.parameter);
        break;

      case 'init':
        result = initializeData();
        break;

      default:
        result = { success: false, error: 'Invalid path: ' + path };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// ユーティリティ関数
// ========================================

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

function getDataAsObjects(sheetName, filters) {
  filters = filters || {};
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return [];

  const headers = data[0];
  const objects = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    let match = true;

    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });

    for (const key in filters) {
      if (String(obj[key]) !== String(filters[key])) {
        match = false;
        break;
      }
    }

    if (match) objects.push(obj);
  }

  return objects;
}

function appendRow(sheetName, values) {
  const sheet = getSheet(sheetName);
  sheet.appendRow(values);
  return sheet.getLastRow() - 1;
}

function updateRow(sheetName, rowIndex, values) {
  if (rowIndex < 0) {
    Logger.log('updateRow: 無効なrowIndex=' + rowIndex + ' シート=' + sheetName + ' (操作をスキップ)');
    return;
  }
  const sheet = getSheet(sheetName);
  const range = sheet.getRange(rowIndex + 2, 1, 1, values.length);
  range.setValues([values]);
}

function deleteRow(sheetName, rowIndex) {
  if (rowIndex < 0) {
    Logger.log('deleteRow: 無効なrowIndex=' + rowIndex + ' シート=' + sheetName + ' (操作をスキップ)');
    return;
  }
  const sheet = getSheet(sheetName);
  sheet.deleteRow(rowIndex + 2);
}

function findRowIndex(sheetName, id) {
  const data = getSheet(sheetName).getDataRange().getValues();
  const idStr = String(id);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idStr) return i - 1;
  }
  return -1;
}

// ========================================
// 商品関連API
// ========================================

function getProducts(params) {
  const filters = {};

  if (params.category) filters.category = params.category;
  if (params.status) filters.status = params.status;

  let products = getDataAsObjects('products', filters);

  if (params.min_price) {
    products = products.filter(function(p) { return p.price >= Number(params.min_price); });
  }
  if (params.max_price) {
    products = products.filter(function(p) { return p.price <= Number(params.max_price); });
  }
  if (params.in_stock === 'true') {
    products = products.filter(function(p) { return p.stock > 0; });
  }

  return { success: true, data: products };
}

function getProductById(id) {
  const products = getDataAsObjects('products', { id: Number(id) });

  if (products.length === 0) {
    return { success: false, error: '商品が見つかりません' };
  }

  return { success: true, data: products[0] };
}

function createProduct(body) {
  const id = new Date().getTime();

  appendRow('products', [
    id,
    body.name,
    body.price,
    body.stock,
    body.category,
    body.description || '',
    body.age_restriction || 0,
    body.status || 'available'
  ]);

  return { success: true, data: { id: id } };
}

// ========================================
// カート関連API
// ========================================

function getCart(memberId) {
  const cartItems = getDataAsObjects('cart_items', { member_id: Number(memberId) });
  const products = getDataAsObjects('products');

  const enrichedCart = cartItems.map(function(item) {
    const product = products.find(function(p) { return String(p.id) === String(item.product_id); });
    return Object.assign({}, item, { product: product });
  });

  return { success: true, data: enrichedCart };
}

function addToCart(body) {
  const memberId = Number(body.member_id);
  const productId = Number(body.product_id);
  const quantity = Number(body.quantity);

  const productResult = getProductById(productId);
  if (!productResult.success) {
    return { success: false, error: '商品が見つかりません' };
  }

  const product = productResult.data;
  if (product.stock < quantity) {
    return { success: false, error: '在庫不足です。在庫数: ' + product.stock };
  }

  const existingCart = getDataAsObjects('cart_items', {
    member_id: memberId,
    product_id: productId
  });

  if (existingCart.length > 0) {
    const newQuantity = Number(existingCart[0].quantity) + quantity;
    if (product.stock < newQuantity) {
      return { success: false, error: '在庫不足です。在庫数: ' + product.stock };
    }

    const rowIndex = findRowIndex('cart_items', existingCart[0].id);

    if (rowIndex === -1) {
      Logger.log('addToCart: 既存アイテムのrowIndex=-1。新規追加にフォールバック (id=' + existingCart[0].id + ')');
      const id = new Date().getTime();
      appendRow('cart_items', [id, memberId, productId, newQuantity, new Date().toISOString()]);
      return { success: true, data: { id: id } };
    }

    updateRow('cart_items', rowIndex, [
      existingCart[0].id,
      memberId,
      productId,
      newQuantity,
      existingCart[0].added_at
    ]);

    return { success: true, data: { id: existingCart[0].id, quantity: newQuantity } };
  }

  const id = new Date().getTime();
  appendRow('cart_items', [
    id,
    memberId,
    productId,
    quantity,
    new Date().toISOString()
  ]);

  return { success: true, data: { id: id } };
}

function updateCartItem(body) {
  const rowIndex = findRowIndex('cart_items', body.id);

  if (rowIndex === -1) {
    return { success: false, error: 'カートアイテムが見つかりません' };
  }

  const cartItems = getDataAsObjects('cart_items', { id: body.id });
  const item = cartItems[0];
  const newQuantity = Number(body.quantity);

  const product = getDataAsObjects('products', { id: item.product_id })[0];
  if (product.stock < newQuantity) {
    return { success: false, error: '在庫不足です' };
  }

  updateRow('cart_items', rowIndex, [
    item.id,
    item.member_id,
    item.product_id,
    newQuantity,
    item.added_at
  ]);

  return { success: true };
}

function deleteCartItem(id) {
  const rowIndex = findRowIndex('cart_items', id);

  if (rowIndex === -1) {
    return { success: false, error: 'カートアイテムが見つかりません' };
  }

  deleteRow('cart_items', rowIndex);
  return { success: true };
}

// ========================================
// 注文関連API
// ========================================

function createOrder(body) {
  const memberId = Number(body.member_id);

  const cartResult = getCart(memberId);
  if (!cartResult.success || cartResult.data.length === 0) {
    return { success: false, error: 'カートが空です' };
  }

  const cartItems = cartResult.data;
  let totalAmount = 0;

  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    const product = item.product;

    if (!product) {
      return { success: false, error: '商品情報の取得に失敗しました' };
    }
    if (product.stock < item.quantity) {
      return {
        success: false,
        error: '在庫不足: ' + product.name + ' (在庫: ' + product.stock + ')'
      };
    }

    totalAmount += product.price * item.quantity;
  }

  let discountAmount = 0;
  if (body.coupon_code) {
    const couponResult = validateCoupon(body.coupon_code);
    if (couponResult.success && couponResult.data.valid) {
      const coupon = couponResult.data.coupon;
      if (coupon.discount_type === 'percentage') {
        discountAmount = totalAmount * (coupon.discount_value / 100);
      } else {
        discountAmount = coupon.discount_value;
      }
      const couponRowIndex = findRowIndex('coupons', coupon.id);
      if (couponRowIndex !== -1) {
        getSheet('coupons').getRange(couponRowIndex + 2, 9).setValue(coupon.used_count + 1);
      }
    }
  }

  const usePoints = Number(body.use_points) || 0;
  discountAmount += usePoints;

  const shippingFee = totalAmount >= 5000 ? 0 : 500;
  const orderId = new Date().getTime();

  appendRow('orders', [
    orderId,
    memberId,
    'pending',
    totalAmount,
    discountAmount,
    shippingFee,
    body.payment_method,
    body.shipping_method || 'standard',
    body.shipping_address || '',
    new Date().toISOString(),
    new Date().toISOString()
  ]);

  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    const product = item.product;
    const orderItemId = new Date().getTime() + Math.random();

    appendRow('order_items', [
      orderItemId,
      orderId,
      product.id,
      item.quantity,
      product.price,
      product.price * item.quantity
    ]);

    const rowIndex = findRowIndex('products', product.id);
    if (rowIndex !== -1) {
      const newStock = product.stock - item.quantity;
      updateRow('products', rowIndex, [
        product.id,
        product.name,
        product.price,
        newStock,
        product.category,
        product.description,
        product.age_restriction,
        newStock === 0 ? 'out_of_stock' : product.status
      ]);
    }
  }

  const cartItemsToDelete = getDataAsObjects('cart_items', { member_id: memberId });
  for (let i = cartItemsToDelete.length - 1; i >= 0; i--) {
    const rowIndex = findRowIndex('cart_items', cartItemsToDelete[i].id);
    if (rowIndex !== -1) {
      deleteRow('cart_items', rowIndex);
    }
  }

  updateMemberRank(memberId, totalAmount);

  return {
    success: true,
    data: {
      order_id: orderId,
      total_amount: totalAmount - discountAmount + shippingFee
    }
  };
}

function getOrders(memberId) {
  const ordersData     = getSheet('orders').getDataRange().getValues();
  const orderItemsData = getSheet('order_items').getDataRange().getValues();
  const productsData   = getSheet('products').getDataRange().getValues();

  if (ordersData.length <= 1) return { success: true, data: [] };

  const ordersHeaders     = ordersData[0];
  const orderItemsHeaders = orderItemsData[0];
  const productsHeaders   = productsData[0];

  const productsMap = {};
  for (let i = 1; i < productsData.length; i++) {
    const p = {};
    productsHeaders.forEach(function(k, j) { p[k] = productsData[i][j]; });
    productsMap[String(p.id)] = p;
  }

  const itemsMap = {};
  for (let i = 1; i < orderItemsData.length; i++) {
    const item = {};
    orderItemsHeaders.forEach(function(k, j) { item[k] = orderItemsData[i][j]; });
    const orderId = String(item.order_id);
    if (!itemsMap[orderId]) itemsMap[orderId] = [];
    item.product = productsMap[String(item.product_id)] || null;
    itemsMap[orderId].push(item);
  }

  const memberIdStr = String(memberId);
  const result = [];
  for (let i = 1; i < ordersData.length; i++) {
    const order = {};
    ordersHeaders.forEach(function(k, j) { order[k] = ordersData[i][j]; });
    if (String(order.member_id) !== memberIdStr) continue;
    order.items = itemsMap[String(order.id)] || [];
    result.push(order);
  }

  return { success: true, data: result };
}

function getOrderById(id) {
  const orders = getDataAsObjects('orders', { id: Number(id) });

  if (orders.length === 0) {
    return { success: false, error: '注文が見つかりません' };
  }

  const order = orders[0];
  const items = getDataAsObjects('order_items', { order_id: order.id });
  const products = getDataAsObjects('products');

  const enrichedItems = items.map(function(item) {
    const product = products.find(function(p) { return String(p.id) === String(item.product_id); });
    return Object.assign({}, item, { product: product });
  });

  return { success: true, data: Object.assign({}, order, { items: enrichedItems }) };
}

// ========================================
// 注文キャンセル
// ========================================

function cancelOrder(body) {
  const orderId = body.order_id;
  const memberId = body.member_id;

  const orderSheet = getSheet('orders');
  const orderData = orderSheet.getDataRange().getValues();

  let orderRowIndex = -1;
  let order = null;

  for (let i = 1; i < orderData.length; i++) {
    if (String(orderData[i][0]) === String(orderId) && String(orderData[i][1]) === String(memberId)) {
      orderRowIndex = i;
      order = {
        id: orderData[i][0],
        member_id: orderData[i][1],
        status: orderData[i][2]
      };
      break;
    }
  }

  if (!order) {
    return { success: false, error: '注文が見つかりません' };
  }

  const cancellableStatuses = ['pending', 'paid', 'preparing'];
  if (!cancellableStatuses.includes(order.status)) {
    return {
      success: false,
      error: '発送済みの注文はキャンセルできません。返品をご希望の場合はお問い合わせください。'
    };
  }

  try {
    orderSheet.getRange(orderRowIndex + 1, 3).setValue('cancelled');
    orderSheet.getRange(orderRowIndex + 1, 11).setValue(new Date().toISOString());

    const orderItemSheet = getSheet('order_items');
    const orderItemData = orderItemSheet.getDataRange().getValues();
    const productSheet = getSheet('products');
    const productData = productSheet.getDataRange().getValues();

    for (let i = 1; i < orderItemData.length; i++) {
      if (String(orderItemData[i][1]) === String(orderId)) {
        const productId = orderItemData[i][2];
        const quantity = orderItemData[i][3];

        for (let j = 1; j < productData.length; j++) {
          if (String(productData[j][0]) === String(productId)) {
            const newStock = productData[j][3] + quantity;
            productSheet.getRange(j + 1, 4).setValue(newStock);
            if (newStock > 0) {
              productSheet.getRange(j + 1, 8).setValue('available');
            }
            break;
          }
        }
      }
    }

    return {
      success: true,
      message: '注文をキャンセルしました。在庫とポイントを返却しました。'
    };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ========================================
// 会員ランク自動更新
// ========================================

function updateMemberRank(memberId, purchaseAmount) {
  const memberSheet = getSheet('members');
  const memberData = memberSheet.getDataRange().getValues();

  for (let i = 1; i < memberData.length; i++) {
    if (String(memberData[i][0]) === String(memberId)) {
      const currentTotal = memberData[i][9] || 0;
      const newTotal = currentTotal + purchaseAmount;

      let newRank = 'general';
      if (newTotal >= 100000) {
        newRank = 'platinum';
      } else if (newTotal >= 50000) {
        newRank = 'gold';
      }

      memberSheet.getRange(i + 1, 6).setValue(newRank);
      memberSheet.getRange(i + 1, 10).setValue(newTotal);

      return { success: true, newRank: newRank, totalPurchase: newTotal };
    }
  }

  return { success: false, error: '会員が見つかりません' };
}

// ========================================
// クーポン関連API
// ========================================

function validateCoupon(code) {
  const coupons = getDataAsObjects('coupons', { code: code });

  if (coupons.length === 0) {
    return { success: true, data: { valid: false, message: 'クーポンコードが無効です' } };
  }

  const coupon = coupons[0];
  const now = new Date();
  const validFrom = new Date(coupon.valid_from);
  const validUntil = new Date(coupon.valid_until);

  if (now < validFrom || now > validUntil) {
    return { success: true, data: { valid: false, message: 'クーポンの有効期限外です' } };
  }

  if (coupon.used_count >= coupon.usage_limit) {
    return { success: true, data: { valid: false, message: 'クーポンの利用上限に達しています' } };
  }

  return { success: true, data: { valid: true, coupon: coupon } };
}

// ========================================
// 会員関連API
// ========================================

function getMemberByEmail(email, password) {
  const members = getDataAsObjects('members').filter(function(m) { return m.email === email; });
  if (members.length === 0) {
    return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' };
  }
  const member = members[0];
  if (member.password_hash !== password) {
    return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' };
  }
  if (member.status !== 'active') {
    return { success: false, error: 'このアカウントは無効です' };
  }
  return {
    success: true,
    data: {
      id: member.id,
      email: member.email,
      name: member.name,
      rank: member.rank,
      points: member.points,
      total_purchase: member.total_purchase
    }
  };
}

function createMember(body) {
  const existing = getDataAsObjects('members').find(function(m) { return m.email === body.email; });
  if (existing) {
    return { success: false, error: 'このメールアドレスは既に登録されています' };
  }
  const id = new Date().getTime();
  appendRow('members', [
    id,
    body.email,
    body.password,
    body.name,
    body.birth_date || '',
    'general',
    'active',
    100,
    new Date().toISOString(),
    0
  ]);
  return {
    success: true,
    data: {
      id: id,
      email: body.email,
      name: body.name,
      rank: 'general',
      points: 100,
      status: 'active',
      total_purchase: 0
    }
  };
}

// ========================================
// 初期データ投入
// ========================================

function initializeData() {
  try {
    const productsSheet = getSheet('products');
    productsSheet.clear();
    productsSheet.appendRow(['id', 'name', 'price', 'stock', 'category', 'description', 'age_restriction', 'status']);

    const products = [
      [1, 'JavaScript入門', 2800, 50, '書籍', 'プログラミング初心者向けの入門書', 0, 'available'],
      [2, 'Python実践ガイド', 3200, 30, '書籍', 'Pythonの実践的な使い方を学ぶ', 0, 'available'],
      [3, 'ワイヤレスマウス', 1980, 100, '電子機器', 'Bluetooth対応の静音マウス', 0, 'available'],
      [4, 'USB-Cケーブル', 890, 200, '電子機器', '高速充電対応 1m', 0, 'available'],
      [5, 'ノートセット', 450, 80, '雑貨', 'A5サイズ 5冊セット', 0, 'available'],
      [6, 'ボールペン(黒)', 120, 500, '雑貨', '油性ボールペン 0.7mm', 0, 'available'],
      [7, 'SQLデータベース設計', 3800, 5, '書籍', 'データベース設計の基礎から応用まで', 0, 'available'],
      [8, 'Webアプリ開発入門', 2980, 0, '書籍', 'HTML/CSS/JavaScriptでWebアプリを作る', 0, 'out_of_stock'],
      [9, 'ワイヤレスキーボード', 4500, 25, '電子機器', 'メカニカル式キーボード', 0, 'available'],
      [10, 'デスクライト', 3200, 15, '雑貨', 'USB給電式 調光機能付き', 0, 'available']
    ];

    products.forEach(function(p) { productsSheet.appendRow(p); });

    const couponsSheet = getSheet('coupons');
    couponsSheet.clear();
    couponsSheet.appendRow(['id', 'code', 'discount_type', 'discount_value', 'min_purchase', 'valid_from', 'valid_until', 'usage_limit', 'used_count']);

    const coupons = [
      [1, 'WELCOME10', 'percentage', 10, 1000, '2026-01-01', '2026-12-31', 100, 0],
      [2, 'BOOK500', 'fixed', 500, 2000, '2026-01-01', '2026-12-31', 50, 0],
      [3, 'FIRSTBUY', 'percentage', 15, 3000, '2026-01-01', '2026-12-31', 200, 0]
    ];

    coupons.forEach(function(c) { couponsSheet.appendRow(c); });

    const membersSheet = getSheet('members');
    membersSheet.clear();
    membersSheet.appendRow(['id', 'email', 'password_hash', 'name', 'birth_date', 'rank', 'status', 'points', 'created_at', 'total_purchase']);
    membersSheet.appendRow([1, 'test@example.com', 'password', 'テストユーザー', '1995-05-15', 'general', 'active', 500, new Date().toISOString(), 0]);

    const cartSheet = getSheet('cart_items');
    cartSheet.clear();
    cartSheet.appendRow(['id', 'member_id', 'product_id', 'quantity', 'added_at']);

    const ordersSheet = getSheet('orders');
    ordersSheet.clear();
    ordersSheet.appendRow(['id', 'member_id', 'status', 'total_amount', 'discount_amount', 'shipping_fee', 'payment_method', 'shipping_method', 'shipping_address', 'created_at', 'updated_at']);

    const orderItemsSheet = getSheet('order_items');
    orderItemsSheet.clear();
    orderItemsSheet.appendRow(['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'subtotal']);

    return {
      success: true,
      message: '初期データを投入しました',
      data: { products: products.length, coupons: coupons.length }
    };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
