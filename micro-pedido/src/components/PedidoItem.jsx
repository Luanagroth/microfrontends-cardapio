import React from 'react';
import { formatCurrency } from '../../../shared/formatters';

const PedidoItem = ({ item, onRemove }) => (
  <article className="pedido-item">
    <div className="pedido-details">
      <h4 className="item-title">{item.nome}</h4>
      <p className="item-desc">{item.descricao}</p>
      {item.observacao ? (
        <div className="observacao">
          <strong>Observação:</strong> <span className="observacao-text">{item.observacao}</span>
        </div>
      ) : null}
    </div>

    <div className="pedido-actions">
      <strong className="item-price">{formatCurrency(item.preco)}</strong>
      <button type="button" className="remove-btn" onClick={onRemove}>Remover</button>
    </div>
  </article>
);

export default PedidoItem;
