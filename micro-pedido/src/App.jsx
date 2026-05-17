import React, { useEffect, useState } from 'react';
import './styles.css';
import PedidoItem from './components/PedidoItem';
import ResumoPedido from './components/ResumoPedido';
import { COUPONS, findCouponByCode } from '../../shared/coupons';
import { EVENTS } from '../../shared/events';
import { formatCurrency, formatTime } from '../../shared/formatters';
import { PAYMENT_METHODS } from '../../shared/paymentMethods';

export const PedidoApp = () => {
  const [itens, setItens] = useState([]);
  const [mesa, setMesa] = useState('');
  const [openTime, setOpenTime] = useState(null);
  const [closeTime, setCloseTime] = useState(null);
  const [cupom, setCupom] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [cupomMessage, setCupomMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');

  const handleCloseComanda = () => {
    if (!closeTime) setCloseTime(new Date().toISOString());
  };

  const handleClearComanda = () => {
    setItens([]);
    setCupom('');
    setAppliedCoupon(null);
    setCupomMessage('');
    setOpenTime(null);
    setCloseTime(null);
    setPaymentMethod('');
    setReceivedAmount('');
  };

  useEffect(() => {
    const handleAdicionarAoPedido = (event) => {
      const item = event.detail;
      setItens((prev) => {
        const next = [...prev, { ...item, key: Date.now() + Math.random() }];
        if (!openTime) setOpenTime(new Date().toISOString());
        return next;
      });
    };

    const handleMesaSelecionada = (event) => {
      const selecionada = event.detail?.mesa;
      if (selecionada) {
        setMesa(selecionada);
      }
    };

    window.addEventListener(EVENTS.ADD_TO_ORDER, handleAdicionarAoPedido);
    window.addEventListener(EVENTS.TABLE_SELECTED, handleMesaSelecionada);

    return () => {
      window.removeEventListener(EVENTS.ADD_TO_ORDER, handleAdicionarAoPedido);
      window.removeEventListener(EVENTS.TABLE_SELECTED, handleMesaSelecionada);
    };
  }, [openTime]);

  const handleRemove = (key) => {
    setItens((prev) => prev.filter((p) => p.key !== key));
  };

  const subtotal = itens.reduce((s, it) => s + (parseFloat(it.preco) || 0), 0);

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
  const statusLabel = mesa ? 'Aberta' : 'Aguardando';

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(EVENTS.ORDER_STATE, {
        detail: {
          mesa,
          itemCount: itens.length,
          total
        }
      })
    );
  }, [mesa, itens, total]);

  return (
    <div className="pedido-root">
      <section className="command-panel">
        <div className="command-main-row">
          <strong className="command-table">{mesaLabel}</strong>
          <span className={`command-status ${mesa ? 'open' : 'waiting'}`}>Status: {statusLabel}</span>
        </div>

        <div className="command-meta-grid">
          <div>
            <span>Abertura:</span>
            <strong>{openTime ? formatTime(openTime) : '--:--'}</strong>
          </div>
          <div>
            <span>Fechamento:</span>
            <strong>{closeTime ? formatTime(closeTime) : '--:--'}</strong>
          </div>
          <div>
            <span>Atendimento:</span>
            <strong>Online</strong>
          </div>
        </div>
      </section>

      <section className="command-section">
        <h3 className="command-section-title">Itens do pedido</h3>
        {itens.length === 0 ? (
          <div className="empty">Nenhum item na comanda</div>
        ) : (
          <div className="pedido-list">
            {itens.map((item) => (
              <PedidoItem key={item.key} item={item} onRemove={() => handleRemove(item.key)} />
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
        <button type="button" className="secondary-btn" onClick={handleClearComanda}>Limpar comanda</button>
        <button type="button" className="btn" onClick={handleCloseComanda}>Fechar comanda</button>
      </div>
    </div>
  );
};

export default PedidoApp;
