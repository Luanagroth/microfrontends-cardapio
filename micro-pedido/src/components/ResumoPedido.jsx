import React from 'react';
import { formatCurrency } from '../../../shared/formatters';

const ResumoPedido = ({ itens = [], subtotal = 0, discount = 0, total = 0, coupon = null }) => {
  return (
    <section className="summary">
      <h3 className="command-section-title">Resumo financeiro</h3>
      <div className="summary-row">
        <span>Itens:</span>
        <strong>{itens.length}</strong>
      </div>
      <div className="summary-row">
        <span>Subtotal:</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
      <div className="summary-row">
        <span>Desconto:</span>
        <strong>{formatCurrency(discount)}</strong>
      </div>
      {coupon ? (
        <div className="summary-coupon">
          Cupom aplicado: <strong>{coupon.code}</strong>
        </div>
      ) : null}
      <div className="summary-total">
        <span>TOTAL FINAL:</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </section>
  );
};

export default ResumoPedido;
