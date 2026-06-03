// Fonction d'échappement HTML pour prévenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const cartItemsContainer = document.getElementById('cartItems');
const checkoutBtn = document.getElementById('checkoutBtn');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const shippingEl = document.getElementById('shipping');

function renderCart() {
  const cart = window.cartUtils.getCart();

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <h2>Votre panier est vide</h2>
        <p>Découvrez notre collection de vêtements bohème chic</p>
        <a href="collection.html" class="btn-primary">Voir la collection</a>
      </div>
    `;
    updateSummary();
    return;
  }

  cartItemsContainer.innerHTML = cart.map((item, index) => `
    <div class="cart-item" data-index="${index}">
      <div class="cart-item-image">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
      </div>
      <div class="cart-item-details">
        <h3>${escapeHtml(item.name)}</h3>
        <p class="cart-item-meta">Taille : ${escapeHtml(item.size)} • Couleur : ${escapeHtml(item.color)}</p>
        <p class="cart-item-price">${parseFloat(item.price).toFixed(2).replace('.', ',')} €</p>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-control">
          <button class="qty-btn" onclick="updateQuantity(${index}, ${parseInt(item.quantity, 10) - 1})">-</button>
          <span class="qty-display">${parseInt(item.quantity, 10)}</span>
          <button class="qty-btn" onclick="updateQuantity(${index}, ${parseInt(item.quantity, 10) + 1})">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem(${index})" aria-label="Supprimer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  updateSummary();
}

function updateQuantity(index, newQty) {
  const cart = window.cartUtils.getCart();
  const item = cart[index];

  if (newQty < 1) {
    if (confirm('Voulez-vous retirer cet article du panier ?')) {
      window.cartUtils.removeFromCart(item.id, item.size, item.color);
      renderCart();
    }
  } else if (newQty <= 10) {
    window.cartUtils.updateCartItemQuantity(item.id, item.size, item.color, newQty);
    renderCart();
  }
}

function removeItem(index) {
  const cart = window.cartUtils.getCart();
  const item = cart[index];

  if (confirm(`Retirer "${item.name}" du panier ?`)) {
    window.cartUtils.removeFromCart(item.id, item.size, item.color);
    renderCart();
    window.showNotification('Article retiré du panier');
  }
}

function updateSummary() {
  const total = window.cartUtils.getCartTotal();
  const cart = window.cartUtils.getCart();

  subtotalEl.textContent = `${total.toFixed(2).replace('.', ',')} €`;
  totalEl.textContent = `${total.toFixed(2).replace('.', ',')} €`;

  if (total >= 59) {
    shippingEl.textContent = 'Gratuite';
    shippingEl.style.color = '#16a34a';
  } else {
    const remaining = (59 - total).toFixed(2);
    shippingEl.textContent = `${remaining.replace('.', ',')} € pour la livraison gratuite`;
    shippingEl.style.color = '#78716c';
  }

  if (cart.length === 0) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Panier vide';
  } else {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Passer la commande';
  }
}

checkoutBtn.addEventListener('click', () => {
  const cart = window.cartUtils.getCart();
  if (cart.length > 0) {
    window.location.href = 'checkout.html';
  }
});

renderCart();
