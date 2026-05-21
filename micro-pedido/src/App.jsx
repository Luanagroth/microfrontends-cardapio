import React, { useEffect, useMemo, useState } from 'react';
import './styles.css';
import PedidoItem from './components/PedidoItem';
import ResumoPedido from './components/ResumoPedido';
import { COUPONS, findCouponByCode } from '../../shared/coupons';
import { EVENTS } from '../../shared/events';
import { formatCurrency, formatTime } from '../../shared/formatters';
import { PAYMENT_METHODS } from '../../shared/paymentMethods';
import {
  createOrder,
  fetchOrderProducts,
  fetchOrders,
  updateOrder
} from './services/orderService.ts';

const ACTIVE_ORDER_STATUSES = ['aberta', 'em preparo', 'entregue'];
const PUBLIC_MENU_ASSET_BASE =
  typeof window !== 'undefined' && /vercel\.app$/i.test(window.location.hostname)
    ? 'https://microfrontends-cardapio.vercel.app'
    : 'http://localhost:4001';

const menuAsset = (fileName) => `${PUBLIC_MENU_ASSET_BASE}/assets/images/menu/${fileName}`;

const normalizeDishName = (name = '') =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const menuImagesByDish = {
  'salada-caprese': menuAsset('salada-caprese.png'),
  'bolinho-de-arroz': menuAsset('antipasto-italiano.png'),
  'bruschetta-classica': menuAsset('bruschetta-italiana.png'),
  'lasanha-da-casa': menuAsset('lasanha-artesanal.png'),
  'file-mignon-ao-molho': menuAsset('file-mignon.png'),
  'risoto-de-cogumelos': menuAsset('risoto-cogumelos.png'),
  'vinho-da-casa': menuAsset('taca-vinho.png'),
  'cerveja-artesanal': menuAsset('drink-autoral.png'),
  'suco-natural': menuAsset('suco-natural.png'),
  'brownie-quente': menuAsset('brownie.png'),
  'cheesecake-de-frutas': menuAsset('cheesecake.png'),
  'pudim-cremoso': menuAsset('pudim.png')
};

const menuImagesByCategory = {
  Entradas: menuAsset('bruschetta-italiana.png'),
  Saladas: menuAsset('salada-caprese.png'),
  'Pratos Quentes': menuAsset('lasanha-artesanal.png'),
  'Pratos Principais': menuAsset('lasanha-artesanal.png'),
  Bebidas: menuAsset('taca-vinho.png'),
  Sobremesas: menuAsset('cheesecake.png')
};

const getCategoryLabel = (category) => {
  if (!category) return '';
  if (typeof category === 'string') return category;
  return category.label || category.name || '';
};

const resolveProductImage = (product = {}) => {
  const directImage = product.imageUrl || product.photoUrl || product.thumbnail || product.image;
  if (directImage) return directImage;
  const dishImage = menuImagesByDish[normalizeDishName(product.name || product.nome)];
  if (dishImage) return dishImage;
  return menuImagesByCategory[getCategoryLabel(product.category || product.categoria)] || '';
};

const publishOccupiedTables = (orders = []) => {
  const tableDetails = {};
  // Keep container's table map in sync with live order status and totals.
  const occupiedTables = orders.reduce((acc, order) => {
    const hasItems = Array.isArray(order.items) && order.items.length > 0;
    if (hasItems && ACTIVE_ORDER_STATUSES.includes(order.status)) {
      const tableKey = String(order.tableNumber);
      acc[tableKey] = true;
      tableDetails[tableKey] = {
        customerName: order.customerName || '',
        itemCount: order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        total: Number(order.total || 0),
        status: order.status
      };
    }
    return acc;
  }, {});

  window.dispatchEvent(
    new CustomEvent(EVENTS.ORDER_STATE, {
      detail: { occupiedTables, tableDetails }
    })
  );
};

const normalizeProduct = (product) => ({
  productId: product.id,
  name: product.name,
  category: product.category?.label || 'Sem categoria',
  price: Number(product.price || 0),
  available: product.available !== false,
  imageUrl: resolveProductImage(product)
});

const buildOrderItem = (product, quantity) => {
  const itemQuantity = Math.max(1, Number(quantity || 1));
  const price = Number(product.price || 0);
  return {
    productId: product.productId,
    name: product.name,
    category: product.category,
    imageUrl: product.imageUrl || '',
    price,
    quantity: itemQuantity,
    subtotal: Number((price * itemQuantity).toFixed(2))
  };
};

const enrichOrderItemsWithImages = (items = [], productList = []) =>
  items.map((item) => {
    const relatedProduct = productList.find((product) => String(product.productId) === String(item.productId));
    const imageUrl =
      item.imageUrl ||
      relatedProduct?.imageUrl ||
      resolveProductImage({
        name: item.name || item.nome,
        category: item.category || item.categoria || relatedProduct?.category
      });

    return { ...item, imageUrl };
  });

const getOrderDate = (order) => new Date(order.updatedAt || order.createdAt || Date.now());

const formatOrderDate = (dateLike) =>
  new Intl.DateTimeFormat('pt-BR').format(new Date(dateLike));

export const PedidoApp = () => {
  const [itens, setItens] = useState([]);
  const [mesa, setMesa] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState('aberta');
  const [openTime, setOpenTime] = useState(null);
  const [closeTime, setCloseTime] = useState(null);
  const [cupom, setCupom] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [cupomMessage, setCupomMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saveAlert, setSaveAlert] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [viewedOrderId, setViewedOrderId] = useState(null);

  const availableProducts = useMemo(() => products.filter((product) => product.available), [products]);
  const filteredHistoryOrders = useMemo(() => {
    const start = historyDate ? new Date(`${historyDate}T00:00:00`) : null;
    const end = historyDate ? new Date(`${historyDate}T23:59:59`) : null;

    return orders
      .slice()
      .sort((a, b) => getOrderDate(b).getTime() - getOrderDate(a).getTime())
      .filter((order) => {
        const orderDate = getOrderDate(order);
        if (start && orderDate < start) return false;
        if (end && orderDate > end) return false;
        return true;
      });
  }, [historyDate, orders]);

  const viewedOrder = useMemo(() => {
    if (!viewedOrderId) return null;
    const order = orders.find((item) => String(item.id) === String(viewedOrderId));
    if (!order) return null;
    return {
      ...order,
      items: enrichOrderItemsWithImages(order.items || [], products)
    };
  }, [orders, products, viewedOrderId]);

  const viewedOrderItems = viewedOrder?.items || [];
  const viewedOrderItemCount = viewedOrderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const viewedOrderDetails = viewedOrder?.details || {};
  const viewedOrderSubtotal = Number(
    viewedOrderDetails.subtotal ??
    viewedOrderItems.reduce((sum, item) => sum + Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 1)), 0)
  );
  const viewedOrderDiscount = Number(viewedOrderDetails.discount || 0);
  const viewedOrderTotal = Number(viewedOrderDetails.total ?? viewedOrder?.total ?? Math.max(0, viewedOrderSubtotal - viewedOrderDiscount));

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productList, orderList] = await Promise.all([fetchOrderProducts(), fetchOrders()]);
      setProducts(productList.map(normalizeProduct));
      setOrders(orderList);
      publishOccupiedTables(orderList);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar produtos ou comandas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!viewedOrderId) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setViewedOrderId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewedOrderId]);

  const refreshOrders = async () => {
    try {
      const orderList = await fetchOrders();
      setOrders(orderList);
      publishOccupiedTables(orderList);
      return orderList;
    } catch (err) {
      console.error(err);
      return orders;
    }
  };

  const addOrderItem = (product, itemQuantity = 1) => {
    if (!product) return;
    setItens((prev) => {
      const existing = prev.find((item) => item.productId === product.productId);
      if (existing) {
        return prev.map((item) => {
          if (item.productId !== product.productId) return item;
          const nextQuantity = item.quantity + Math.max(1, Number(itemQuantity || 1));
          return {
            ...item,
            quantity: nextQuantity,
            subtotal: Number((item.price * nextQuantity).toFixed(2))
          };
        });
      }
      return [...prev, buildOrderItem(product, itemQuantity)];
    });
    if (!openTime) setOpenTime(new Date().toISOString());
    setSuccess('');
  };

  const prepareOrderForTable = (selectedTable) => {
    const tableKey = String(selectedTable);
    const activeOrder = orders.find((order) => {
      const hasItems = Array.isArray(order.items) && order.items.length > 0;
      return String(order.tableNumber) === tableKey && hasItems && ACTIVE_ORDER_STATUSES.includes(order.status);
    });

    if (activeOrder) {
      setOrderId(activeOrder.id);
      setMesa(activeOrder.tableNumber);
      setCustomerName(activeOrder.customerName || '');
      setOrderStatus(activeOrder.status);
      setItens(enrichOrderItemsWithImages(activeOrder.items || [], products));
      setOpenTime(activeOrder.createdAt);
      setCloseTime(activeOrder.status === 'fechada' ? activeOrder.updatedAt : null);
      setSuccess(`Comanda ${activeOrder.id} carregada.`);
      setError('');
      return;
    }

    setMesa(tableKey);
    setItens([]);
    setCustomerName('');
    setOrderId(null);
    setOrderStatus('aberta');
    setCupom('');
    setAppliedCoupon(null);
    setCupomMessage('');
    setOpenTime(null);
    setCloseTime(null);
    setPaymentMethod('');
    setReceivedAmount('');
    setSelectedProductId('');
    setQuantity(1);
    setSuccess('');
    setError('');
  };

  useEffect(() => {
    const handleAdicionarAoPedido = (event) => {
      const item = event.detail;
      const product = {
        productId: item.id,
        name: item.nome,
        category: item.categoria || 'Cardápio',
        price: Number(item.preco || 0),
        available: true,
        imageUrl: resolveProductImage(item)
      };
      addOrderItem(product, 1);
    };

    const handleMesaSelecionada = (event) => {
      const selecionada = event.detail?.mesa;
      if (selecionada) {
        prepareOrderForTable(selecionada);
      }
    };

    window.addEventListener(EVENTS.ADD_TO_ORDER, handleAdicionarAoPedido);
    window.addEventListener(EVENTS.TABLE_SELECTED, handleMesaSelecionada);

    return () => {
      window.removeEventListener(EVENTS.ADD_TO_ORDER, handleAdicionarAoPedido);
      window.removeEventListener(EVENTS.TABLE_SELECTED, handleMesaSelecionada);
    };
  }, [openTime, orders, products]);

  const resetOrder = () => {
    setItens([]);
    setMesa('');
    setCustomerName('');
    setOrderId(null);
    setOrderStatus('aberta');
    setCupom('');
    setAppliedCoupon(null);
    setCupomMessage('');
    setOpenTime(new Date().toISOString());
    setCloseTime(null);
    setPaymentMethod('');
    setReceivedAmount('');
    setSelectedProductId('');
    setQuantity(1);
    setError('');
    setSuccess('');
    setSaveAlert('');
  };

  const handleNewOrder = () => {
    const shouldStart = window.confirm('Tem certeza que deseja iniciar uma nova comanda?');
    if (!shouldStart) return;
    resetOrder();
  };

  const handleAddSelectedProduct = () => {
    const product = availableProducts.find((item) => String(item.productId) === String(selectedProductId));
    if (!product) {
      setError('Selecione um produto disponível para adicionar.');
      return;
    }
    addOrderItem(product, quantity);
    setSelectedProductId('');
    setQuantity(1);
    setError('');
    setSaveAlert('');
  };

  const handleRemove = (productId) => {
    setItens((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleViewSavedOrder = (order) => {
    setViewedOrderId(order.id);
    setError('');
    setSuccess('');
    setSaveAlert('');
  };

  const handleCloseSavedOrder = () => {
    setViewedOrderId(null);
  };

  const subtotal = itens.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  const applyCoupon = (selectedCode) => {
    const code = (selectedCode || cupom || '').trim().toUpperCase();
    if (!code) return;
    setCupom(code);
    const coupon = findCouponByCode(code);
    if (coupon) {
      setAppliedCoupon(coupon);
      setCupomMessage(coupon.message);
    } else {
      setAppliedCoupon(null);
      setCupomMessage('Cupom inválido');
      setTimeout(() => setCupomMessage(''), 3000);
    }
  };

  const discount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') return (subtotal * appliedCoupon.value) / 100;
    return appliedCoupon.value;
  })();

  const total = Math.max(0, subtotal - discount);
  const receivedValue = parseFloat(receivedAmount.replace(',', '.')) || 0;
  const changeValue = paymentMethod === 'Dinheiro' ? Math.max(0, receivedValue - total) : 0;
  const mesaLabel = mesa ? `Mesa ${String(mesa).padStart(2, '0')}` : 'Nenhuma mesa';
  const itemCount = itens.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const hasItems = itemCount > 0;
  const visualStatus = hasItems ? 'Ocupada' : 'Disponível';
  const commandContextTitle = !mesa
    ? 'Selecione uma mesa no mapa'
    : hasItems
      ? 'Comanda ativa'
      : `Mesa ${String(mesa).padStart(2, '0')} selecionada`;
  const commandContextDetail = !mesa
    ? 'Aguardando seleção'
    : hasItems
      ? `${itemCount} ${itemCount === 1 ? 'item' : 'itens'} • ${formatCurrency(total)}`
      : 'Nenhuma comanda ativa • Pronta para iniciar pedido';

  const orderPayload = (statusOverride = orderStatus) => ({
    // "details" fields are persisted in backend as part of the serialized order payload.
    tableNumber: String(mesa),
    customerName,
    status: statusOverride,
    items: itens,
    subtotal,
    discount,
    total,
    couponCode: appliedCoupon?.code || '',
    couponLabel: appliedCoupon?.label || '',
    paymentMethod,
    receivedAmount: receivedValue,
    changeValue,
    openedAt: openTime,
    closedAt: statusOverride === 'fechada' ? closeTime || new Date().toISOString() : closeTime
  });

  const handleSaveOrder = async (statusOverride = orderStatus, options = {}) => {
    if (!mesa) {
      setError('Informe o número da mesa para salvar a comanda.');
      return;
    }
    if (itens.length === 0) {
      setError('Adicione pelo menos um item para salvar a comanda.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    setSaveAlert('');
    try {
      const saved = orderId
        ? await updateOrder(orderId, orderPayload(statusOverride))
        : await createOrder(orderPayload(statusOverride));
      setOrderId(saved.id);
      setOrderStatus(saved.status);
      setOpenTime(saved.createdAt || openTime || new Date().toISOString());
      setSaveAlert('Comanda salva');
      await refreshOrders();
      if (options.clearAfterSave) {
        resetOrder();
        setSaveAlert('');
        setSuccess('Comanda fechada com sucesso.');
      }
    } catch (err) {
      console.error(err);
      setError('Não foi possível salvar a comanda.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseComanda = () => {
    const shouldClose = window.confirm('Tem certeza que deseja fechar a comanda?');
    if (!shouldClose) return;
    setOrderStatus('fechada');
    if (!closeTime) setCloseTime(new Date().toISOString());
    handleSaveOrder('fechada', { clearAfterSave: true });
  };

  return (
    <div className="pedido-root">
      <section className="command-panel">
        <div className="command-main-row">
          <div className="command-heading">
            <strong className="command-table">{mesaLabel}</strong>
            <span>{commandContextTitle}</span>
            <em>{commandContextDetail}</em>
          </div>
          <span className={`command-status ${hasItems ? 'occupied' : 'free'}`}>
            {mesa ? visualStatus : 'Aguardando'}
          </span>
        </div>

        <div className="command-meta-grid">
          <div>
            <span>Total atual</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <div>
            <span>Itens</span>
            <strong>{itemCount}</strong>
          </div>
          <div>
            <span>Cliente</span>
            <strong>{customerName || 'Não informado'}</strong>
          </div>
          <div>
            <span>Abertura</span>
            <strong>{openTime ? formatTime(openTime) : '--:--'}</strong>
          </div>
          <div>
            <span>Atendimento</span>
            <strong>{orderId ? `#${orderId}` : 'Nova'}</strong>
          </div>
        </div>
      </section>

      <section className="command-section">
        <h3 className="command-section-title">Dados da comanda</h3>
        <div className="order-form-grid compact">
          <label>
            Cliente
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nome do cliente" />
          </label>
        </div>
      </section>

      <section className="command-section">
        <h3 className="command-section-title">Adicionar item do cardápio</h3>
        {loading ? (
          <div className="command-skeleton-list">
            <div className="command-skeleton" />
            <div className="command-skeleton short" />
          </div>
        ) : availableProducts.length === 0 ? (
          <div className="empty">Nenhum produto disponível.</div>
        ) : (
          <div className="order-add-grid">
            <label>
              Produto
              <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                <option value="">Selecione</option>
                {availableProducts.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.name} - {product.category} - {formatCurrency(product.price)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantidade
              <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </label>
            <button type="button" className="btn" onClick={handleAddSelectedProduct}>
              Adicionar à comanda
            </button>
          </div>
        )}
      </section>

      {error ? <div className="form-error">{error}</div> : null}
      {success ? <div className="form-success">{success}</div> : null}

      <section className="command-section">
        <h3 className="command-section-title">Itens do pedido</h3>
        {itens.length === 0 ? (
          <div className="empty">Nenhum item na comanda</div>
        ) : (
          <div className="pedido-list">
            {itens.map((item) => (
              <PedidoItem key={item.productId} item={item} onRemove={() => handleRemove(item.productId)} />
            ))}
          </div>
        )}
      </section>

      <section className="command-section">
        <h3 className="command-section-title">Cupons disponíveis</h3>
        <div className="coupon-chips">
          {COUPONS.map((coupon) => (
            <button
              key={coupon.code}
              type="button"
              className={`coupon-chip ${appliedCoupon?.code === coupon.code ? 'active' : ''}`}
              onClick={() => applyCoupon(coupon.code)}
            >
              <strong>{coupon.code}</strong>
              <span>{coupon.label}</span>
            </button>
          ))}
        </div>
        {cupomMessage ? <div className="coupon-message">{cupomMessage}</div> : null}
      </section>

      <section className="command-section">
        <h3 className="command-section-title">Forma de pagamento</h3>
        <div className="payment-options">
          {PAYMENT_METHODS.map((option) => (
            <label key={option} className={`payment-option ${paymentMethod === option ? 'selected' : ''}`}>
              <input
                type="radio"
                name="payment-method"
                value={option}
                checked={paymentMethod === option}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>

        {paymentMethod === 'Dinheiro' ? (
          <div className="cash-panel">
            <label htmlFor="received-amount">Valor recebido:</label>
            <input
              id="received-amount"
              className="cash-input"
              inputMode="decimal"
              placeholder="0,00"
              value={receivedAmount}
              onChange={(event) => setReceivedAmount(event.target.value)}
            />
            <div className="change-row">
              <span>Troco:</span>
              <strong>{formatCurrency(changeValue)}</strong>
            </div>
          </div>
        ) : null}
      </section>

      <ResumoPedido itens={itens} subtotal={subtotal} discount={discount} total={total} coupon={appliedCoupon} />

      <div className="command-footer">
        <button type="button" className="secondary-btn" onClick={handleNewOrder}>Nova comanda</button>
        <button type="button" className="secondary-btn" onClick={() => handleSaveOrder()} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar comanda'}
        </button>
        <button type="button" className="btn" onClick={handleCloseComanda} disabled={saving}>Fechar comanda</button>
      </div>

      {saveAlert ? (
        <div className="save-alert" role="alert" aria-live="polite">
          {saveAlert}
        </div>
      ) : null}

      <section className="command-section">
        <div className="saved-orders-header">
          <div>
            <h3 className="command-section-title">Comandas salvas</h3>
            <span>Historico interno para consulta</span>
          </div>
          <label className="history-date-filter">
            Dia
            <input type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} />
          </label>
        </div>
        {loading ? (
          <div className="command-skeleton-list">
            <div className="command-skeleton" />
            <div className="command-skeleton" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty">Nenhuma comanda salva.</div>
        ) : filteredHistoryOrders.length === 0 ? (
          <div className="empty">Nenhuma comanda encontrada para este dia.</div>
        ) : (
          <div className="saved-orders-list">
            {filteredHistoryOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                className={`saved-order-button ${String(viewedOrderId) === String(order.id) ? 'selected' : ''}`}
                onClick={() => handleViewSavedOrder(order)}
              >
                <span className="saved-order-main">
                  <strong>Mesa {String(order.tableNumber).padStart(2, '0')} • {order.customerName || 'Cliente não informado'}</strong>
                  <span>{(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)} itens • {formatCurrency(order.total || 0)}</span>
                </span>
                <em className={`order-status-badge ${ACTIVE_ORDER_STATUSES.includes(order.status) ? 'active' : 'closed'}`}>
                  {ACTIVE_ORDER_STATUSES.includes(order.status) ? 'Ocupada' : 'Disponível'}
                </em>
              </button>
            ))}
          </div>
        )}
      </section>
      {viewedOrder ? (
        <div className="order-modal-backdrop" role="presentation" onClick={handleCloseSavedOrder}>
          <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="saved-order-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="order-modal-close" aria-label="Fechar demonstrativo" onClick={handleCloseSavedOrder}>
              X
            </button>

            <div className="order-modal-header">
              <div>
                <span>Consulta de comanda</span>
                <h3 id="saved-order-title">Comanda #{viewedOrder.id}</h3>
              </div>
              <em className={`order-status-badge ${ACTIVE_ORDER_STATUSES.includes(viewedOrder.status) ? 'active' : 'closed'}`}>
                {viewedOrder.status}
              </em>
            </div>

            <div className="order-modal-grid">
              <div><span>Mesa</span><strong>{String(viewedOrder.tableNumber).padStart(2, '0')}</strong></div>
              <div><span>Cliente</span><strong>{viewedOrder.customerName || 'Nao informado'}</strong></div>
              <div><span>Criada em</span><strong>{formatOrderDate(viewedOrder.createdAt)} {formatTime(viewedOrder.createdAt)}</strong></div>
              <div><span>Atualizada em</span><strong>{formatOrderDate(viewedOrder.updatedAt)} {formatTime(viewedOrder.updatedAt)}</strong></div>
              <div><span>Abertura</span><strong>{viewedOrderDetails.openedAt ? `${formatOrderDate(viewedOrderDetails.openedAt)} ${formatTime(viewedOrderDetails.openedAt)}` : '--'}</strong></div>
              <div><span>Fechamento</span><strong>{viewedOrderDetails.closedAt ? `${formatOrderDate(viewedOrderDetails.closedAt)} ${formatTime(viewedOrderDetails.closedAt)}` : '--'}</strong></div>
              <div><span>Itens</span><strong>{viewedOrderItemCount}</strong></div>
              <div><span>Pagamento</span><strong>{viewedOrderDetails.paymentMethod || 'Nao informado'}</strong></div>
              <div><span>Cupom</span><strong>{viewedOrderDetails.couponCode || 'Nenhum'}</strong></div>
              <div><span>Valor recebido</span><strong>{formatCurrency(Number(viewedOrderDetails.receivedAmount || 0))}</strong></div>
              <div><span>Troco</span><strong>{formatCurrency(Number(viewedOrderDetails.changeValue || 0))}</strong></div>
            </div>

            <div className="order-modal-items">
              <h4>Itens da comanda</h4>
              {viewedOrderItems.map((item, index) => (
                <div key={`${viewedOrder.id}-${item.productId || item.name}-${index}`} className="order-modal-item">
                  <span>
                    <strong>{item.quantity || 1}x {item.name}</strong>
                    <em>{item.category || 'Item da comanda'} - unitario {formatCurrency(Number(item.price || 0))}</em>
                  </span>
                  <strong>{formatCurrency(item.subtotal || Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                </div>
              ))}
            </div>

            <div className="order-modal-totals">
              <div><span>Subtotal</span><strong>{formatCurrency(viewedOrderSubtotal)}</strong></div>
              <div><span>Desconto</span><strong>{formatCurrency(viewedOrderDiscount)}</strong></div>
              <div className="order-modal-total"><span>Total final</span><strong>{formatCurrency(viewedOrderTotal)}</strong></div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default PedidoApp;
