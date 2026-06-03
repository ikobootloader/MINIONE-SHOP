function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function escapeAttribute(text) {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

function getStatusClass(status) {
  return String(status || 'pending').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'pending';
}

document.querySelectorAll('.admin-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}Tab`).classList.add('active');
  });
});

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    const tbody = document.getElementById('productsTableBody');

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Aucun produit</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${escapeAttribute(p.image)}" alt="${escapeAttribute(p.name)}" style="width:50px;height:50px;object-fit:cover;">
            <span>${escapeHtml(p.name)}</span>
          </div>
        </td>
        <td>${escapeHtml(p.category)}</td>
        <td>${p.price.toFixed(2)} €</td>
        <td>${p.stock}</td>
        <td>
          <button onclick="editProduct(${p.id})" class="btn-small">Modifier</button>
          <button onclick="deleteProduct(${p.id})" class="btn-small btn-danger">Supprimer</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function loadOrders() {
  try {
    const response = await fetch('/api/orders');
    const orders = await response.json();
    const tbody = document.getElementById('ordersTableBody');

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Aucune commande</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>${escapeHtml(o.customer_name)}</td>
        <td>${escapeHtml(o.customer_email)}</td>
        <td>${o.total.toFixed(2)} €</td>
        <td>${new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
        <td><span class="status-badge status-${getStatusClass(o.status)}">${escapeHtml(o.status)}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const addProductBtn = document.getElementById('addProductBtn');
const productModalClose = document.getElementById('productModalClose');

addProductBtn.addEventListener('click', () => {
  document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
  productForm.reset();
  document.getElementById('productId').value = '';
  productModal.style.display = 'flex';
});

productModalClose.addEventListener('click', () => {
  productModal.style.display = 'none';
});

window.editProduct = async (id) => {
  try {
    const response = await fetch(`/api/products/${id}`);
    const product = await response.json();

    document.getElementById('productModalTitle').textContent = 'Modifier le produit';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productSubcategory').value = product.subcategory || '';
    document.getElementById('productSeason').value = product.season;
    document.getElementById('productMaterial').value = product.material || '';
    document.getElementById('productSizes').value = JSON.parse(product.sizes).join(',');
    document.getElementById('productColors').value = JSON.parse(product.colors).join(',');
    document.getElementById('productImage').value = product.image;
    document.getElementById('productBadge').value = product.badge || '';
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productFeatured').checked = product.featured === 1;

    productModal.style.display = 'flex';
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du chargement du produit');
  }
};

window.deleteProduct = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

  try {
    const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('Produit supprimé');
      loadProducts();
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la suppression');
  }
};

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('productId').value;
  const data = {
    name: document.getElementById('productName').value,
    price: parseFloat(document.getElementById('productPrice').value),
    description: document.getElementById('productDescription').value,
    category: document.getElementById('productCategory').value,
    subcategory: document.getElementById('productSubcategory').value,
    season: document.getElementById('productSeason').value,
    material: document.getElementById('productMaterial').value,
    sizes: document.getElementById('productSizes').value.split(',').map(s => s.trim()),
    colors: document.getElementById('productColors').value.split(',').map(c => c.trim()),
    image: document.getElementById('productImage').value,
    images: [document.getElementById('productImage').value],
    badge: document.getElementById('productBadge').value,
    stock: parseInt(document.getElementById('productStock').value, 10),
    featured: document.getElementById('productFeatured').checked ? 1 : 0
  };

  try {
    const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
    const method = productId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      alert(productId ? 'Produit modifié' : 'Produit ajouté');
      productModal.style.display = 'none';
      loadProducts();
    } else {
      alert('Erreur lors de l\'enregistrement');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'enregistrement');
  }
});

loadProducts();
loadOrders();
