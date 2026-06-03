// Fonction d'échappement HTML pour prévenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const productId = new URLSearchParams(window.location.search).get('id');
const productContainer = document.getElementById('productContainer');
const breadcrumbProduct = document.getElementById('breadcrumbProduct');

let currentProduct = null;
let selectedSize = null;
let selectedColor = null;

async function loadProduct() {
  if (!productId) {
    productContainer.innerHTML = '<div class="error"><p>Produit introuvable</p><a href="collection.html" class="btn-primary">Retour à la collection</a></div>';
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) throw new Error('Produit non trouvé');

    currentProduct = await response.json();
    const sizes = JSON.parse(currentProduct.sizes);
    const colors = JSON.parse(currentProduct.colors);

    document.title = `${currentProduct.name} - Mininione Shop`;
    breadcrumbProduct.textContent = currentProduct.name;

    productContainer.innerHTML = `
      <div class="product-images">
        <div class="product-main-image">
          <img src="${escapeHtml(currentProduct.image)}" alt="${escapeHtml(currentProduct.name)}" id="mainProductImage">
          ${currentProduct.badge ? `<span class="product-badge-large">${escapeHtml(currentProduct.badge)}</span>` : ''}
        </div>
      </div>

      <div class="product-details">
        <h1 class="product-title">${escapeHtml(currentProduct.name)}</h1>
        <p class="product-price">${parseFloat(currentProduct.price).toFixed(2).replace('.', ',')} €</p>

        <div class="product-meta">
          <span class="meta-item">${escapeHtml(currentProduct.category)}</span>
          ${currentProduct.season ? `<span class="meta-item">${escapeHtml(currentProduct.season)}</span>` : ''}
          ${currentProduct.material ? `<span class="meta-item">${escapeHtml(currentProduct.material)}</span>` : ''}
        </div>

        <div class="product-description">
          <p>${escapeHtml(currentProduct.description)}</p>
        </div>

        <div class="product-options">
          <div class="option-group">
            <label>Taille</label>
            <div class="size-options" id="sizeOptions">
              ${sizes.map(size => `
                <button class="size-option" data-size="${escapeHtml(size)}">${escapeHtml(size)}</button>
              `).join('')}
            </div>
            <p class="option-error" id="sizeError"></p>
          </div>

          <div class="option-group">
            <label>Couleur</label>
            <div class="color-options" id="colorOptions">
              ${colors.map(color => `
                <button class="color-option" data-color="${escapeHtml(color)}" title="${escapeHtml(color)}">
                  <span>${escapeHtml(color)}</span>
                </button>
              `).join('')}
            </div>
            <p class="option-error" id="colorError"></p>
          </div>

          <div class="option-group">
            <label>Quantité</label>
            <div class="quantity-selector">
              <button id="decreaseQty">-</button>
              <input type="number" id="quantity" value="1" min="1" max="10">
              <button id="increaseQty">+</button>
            </div>
          </div>
        </div>

        <div class="product-actions">
          <button id="addToCartBtn" class="btn-primary btn-large">Ajouter au panier</button>
          <button id="wishlistToggle" class="btn-outline btn-icon" aria-label="Ajouter aux favoris">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>

        <div class="product-info-tabs">
          <div class="tab-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span>Livraison gratuite dès 59€</span>
          </div>
          <div class="tab-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>Retours gratuits sous 30 jours</span>
          </div>
        </div>
      </div>
    `;

    // Event listeners pour les options
    setupProductOptions();
  } catch (error) {
    console.error('Erreur:', error);
    productContainer.innerHTML = '<div class="error"><p>Erreur de chargement du produit</p><a href="collection.html" class="btn-primary">Retour à la collection</a></div>';
  }
}

function setupProductOptions() {
  // Sélection de taille
  document.querySelectorAll('.size-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = btn.dataset.size;
      document.getElementById('sizeError').textContent = '';
    });
  });

  // Sélection de couleur
  document.querySelectorAll('.color-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
      document.getElementById('colorError').textContent = '';
    });
  });

  // Quantité
  const qtyInput = document.getElementById('quantity');
  const decreaseBtn = document.getElementById('decreaseQty');
  const increaseBtn = document.getElementById('increaseQty');

  decreaseBtn.addEventListener('click', () => {
    const current = parseInt(qtyInput.value);
    if (current > 1) qtyInput.value = current - 1;
  });

  increaseBtn.addEventListener('click', () => {
    const current = parseInt(qtyInput.value);
    if (current < 10) qtyInput.value = current + 1;
  });

  // Ajouter au panier
  document.getElementById('addToCartBtn').addEventListener('click', () => {
    let hasError = false;

    if (!selectedSize) {
      document.getElementById('sizeError').textContent = 'Veuillez sélectionner une taille';
      hasError = true;
    }

    if (!selectedColor) {
      document.getElementById('colorError').textContent = 'Veuillez sélectionner une couleur';
      hasError = true;
    }

    if (hasError) return;

    const quantity = parseInt(qtyInput.value);
    window.cartUtils.addToCart(currentProduct, selectedSize, selectedColor, quantity);
  });

  // Gestion wishlist
  const wishlistBtn = document.getElementById('wishlistToggle');
  const updateWishlistBtn = () => {
    const isInWishlist = window.wishlistUtils.isInWishlist(currentProduct.id);
    if (isInWishlist) {
      wishlistBtn.classList.add('active');
      wishlistBtn.querySelector('svg').setAttribute('fill', 'currentColor');
      wishlistBtn.setAttribute('aria-label', 'Retirer des favoris');
    } else {
      wishlistBtn.classList.remove('active');
      wishlistBtn.querySelector('svg').setAttribute('fill', 'none');
      wishlistBtn.setAttribute('aria-label', 'Ajouter aux favoris');
    }
  };

  updateWishlistBtn();

  wishlistBtn.addEventListener('click', () => {
    window.wishlistUtils.toggleWishlist(currentProduct);
    updateWishlistBtn();
  });
}

loadProduct();
