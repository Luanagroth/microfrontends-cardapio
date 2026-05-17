import React, { useState } from 'react';
import { EVENTS } from '../../../shared/events';
import { formatPrice } from '../../../shared/formatters';

const PratoCard = ({ prato, number }) => {
  const [observacao, setObservacao] = useState('');

  const handleAdd = () => {
    window.dispatchEvent(
      new CustomEvent(EVENTS.ADD_TO_ORDER, {
        detail: {
          id: prato.id,
          nome: prato.nome,
          descricao: prato.descricao,
          preco: prato.preco,
          observacao: observacao?.trim() || ''
        }
      })
    );
    setObservacao('');
  };

  return (
    <article className="menu-item">
      <div className="menu-item-header">
        <div className="menu-item-title">
          <span className="menu-item-number">{String(number).padStart(2, '0')}.</span>
          <h3>{prato.nome}</h3>
        </div>
        <strong className="menu-item-price">{formatPrice(prato.preco)}</strong>
      </div>

      <p className="menu-item-description">{prato.descricao}</p>

      <label className="menu-item-label" htmlFor={`obs-${prato.id}`}>
        Observações
      </label>
      <textarea
        id={`obs-${prato.id}`}
        className="menu-item-textarea"
        placeholder="Ex: sem cebola, molho à parte..."
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        rows={3}
      />

      <button type="button" className="menu-item-button" onClick={handleAdd}>
        Adicionar ao pedido
      </button>
    </article>
  );
};

export default PratoCard;
