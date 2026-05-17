import React from 'react';
import { formatCurrency } from '../../../shared/formatters';

const PedidoItem = ({ item, onRemove }) => (
  <article className="pedido-item">
    <div className="pedido-item-image">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.nome || item.name} />
      ) : (
        <span>EB</span>
      )}
    </div>

    <div className="pedido-details">
      <h4 className="item-title">{item.nome || item.name}</h4>
      <p className="item-desc">{item.descricao || item.category || ''}</p>
      {item.observacao ? (
        <div className="observacao">
          <strong>Observação:</strong> <span className="observacao-text">{item.observacao}</span>
        </div>
      ) : null}
    </div>

    <div className="pedido-actions">
      <strong className="item-price">{formatCurrency(item.subtotal || item.preco || item.price)}</strong>
      {item.quantity ? <span className="item-quantity">{item.quantity} x {formatCurrency(item.price)}</span> : null}
      <button type="button" className="remove-btn" onClick={onRemove}>Remover</button>
    </div>
  </article>
);

export default PedidoItem;
