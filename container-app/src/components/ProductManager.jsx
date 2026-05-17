import React, { useEffect, useMemo, useState } from 'react';
import { fetchCategories, fetchProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../services/productService.ts';

const initialForm = {
  id: null,
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  categoryId: '',
  available: true,
};

const ProductSkeleton = () => (
  <article className="product-card skeleton-card">
    <div className="product-thumb skeleton-box" />
    <div className="product-info">
      <div className="skeleton-line title" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
    <div className="skeleton-line action" />
  </article>
);

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productList, categoryList] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(productList);
      setCategories(categoryList);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os produtos ou categorias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setImageFile(null);
    setImagePreview('');
    setIsEditing(false);
    setFormError('');
  };

  const openNewForm = () => {
    resetForm();
    setSuccess('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setFormError('');
    setSuccess('');

    if (!file) {
      setImagePreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Nome é obrigatório.';
    if (!form.price || Number(form.price) <= 0) return 'Preço deve ser maior que zero.';
    if (!form.categoryId) return 'Categoria é obrigatória.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setFormLoading(true);
    setFormError('');
    setError('');
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        const uploadResult = await uploadProductImage(imageFile);
        imageUrl = uploadResult.imageUrl;
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl,
        available: form.available,
        categoryId: Number(form.categoryId),
      };

      if (isEditing && form.id) {
        await updateProduct(form.id, payload);
        setSuccess('Produto atualizado com sucesso.');
      } else {
        await createProduct(payload);
        setSuccess('Produto criado com sucesso.');
      }
      await loadData();
      closeForm();
    } catch (err) {
      console.error(err);
      setFormError('Erro ao salvar o produto.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      imageUrl: product.imageUrl || '',
      categoryId: String(product.categoryId || ''),
      available: product.available,
    });
    setImageFile(null);
    setImagePreview(product.imageUrl || '');
    setIsEditing(true);
    setIsFormOpen(true);
    setFormError('');
    setSuccess('');
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Tem certeza de que deseja remover "${product.name}"?`);
    if (!confirmed) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteProduct(product.id);
      setSuccess('Produto removido com sucesso.');
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Erro ao remover o produto.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ id: category.id, label: category.label })),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || product.name.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'TODAS' || String(product.categoryId) === String(categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  return (
    <div className="manager-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cardápio</p>
          <h2>Gestão de cardápio</h2>
          <span>Gerencie os produtos do cardápio</span>
        </div>
        <button type="button" className="primary-button" onClick={openNewForm} disabled={formLoading || loading}>
          Novo produto
        </button>
      </div>

      <div className="filter-bar">
        <label>
          Buscar produto
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar produto..." />
        </label>
        <label>
          Categoria
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="TODAS">Todas as categorias</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="product-list">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      )}
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      {isFormOpen ? (
        <form className="admin-form product-form" onSubmit={handleSubmit} noValidate>
          <div className="form-title-row">
            <div>
              <h3>{isEditing ? 'Editar produto' : 'Novo produto'}</h3>
              <span>Preencha os dados que serão refletidos no backend.</span>
            </div>
            <button type="button" className="ghost-button" onClick={closeForm} disabled={formLoading}>
              Cancelar
            </button>
          </div>

          <div className="form-grid">
            <label>
              Nome
              <input name="name" value={form.name} onChange={handleChange} placeholder="Nome do produto" />
            </label>

            <label>
              Preço
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" />
            </label>

            <label className="span-2">
              Descrição
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Descrição do produto" rows="3" />
            </label>

            <label>
              Categoria
              <select name="categoryId" value={form.categoryId} onChange={handleChange}>
                <option value="">Selecione</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </label>

            <label>
              Imagem do produto
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://exemplo.com/imagem.jpg" />
            </label>

            <label>
              Carregar imagem do computador
              <input type="file" accept="image/*" onChange={handleImageFileChange} />
            </label>

            <label className="check-row">
              <input type="checkbox" name="available" checked={form.available} onChange={handleChange} />
              Disponível
            </label>
          </div>

          {imagePreview || form.imageUrl ? (
            <div className="image-preview">
              <span>Preview da imagem</span>
              <img src={imagePreview || form.imageUrl} alt="Preview do produto" />
            </div>
          ) : null}

          {formError && <div className="form-error">{formError}</div>}

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={formLoading}>
              {formLoading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </form>
      ) : null}

      {!loading && filteredProducts.length === 0 && !error ? (
        <div className="empty">Nenhum produto encontrado.</div>
      ) : !loading ? (
        <div className="product-list">
          {filteredProducts.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-thumb">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>Sem imagem</span>}
              </div>
              <div className="product-info">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description || 'Sem descrição cadastrada.'}</p>
                </div>
                <div className="product-meta">
                  <span>{product.category?.label || 'Sem categoria'}</span>
                  <strong>R$ {Number(product.price).toFixed(2)}</strong>
                  <em className={`availability-pill ${product.available ? 'available' : 'unavailable'}`}>
                    <span className="availability-dot" />
                    {product.available ? 'Disponível' : 'Indisponível'}
                  </em>
                </div>
              </div>
              <div className="card-actions">
                <button type="button" className="ghost-button" onClick={() => handleEdit(product)} disabled={formLoading || loading}>
                  Editar
                </button>
                <button type="button" className="danger-button" onClick={() => handleDelete(product)} disabled={formLoading || loading}>
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ProductManager;
