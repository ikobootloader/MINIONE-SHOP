function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const checkoutForm = document.getElementById('checkoutForm');
const orderItemsContainer = document.getElementById('orderItems');
const summarySubtotalEl = document.getElementById('summarySubtotal');
const summaryShippingEl = document.getElementById('summaryShipping');
const summaryTotalEl = document.getElementById('summaryTotal');

const cartItems = window.cartUtils.getCart();
if (cartItems.length === 0) {
  alert('Votre panier est vide');
  window.location.href = 'collection.html';
}

function renderOrderSummary() {
  const currentCart = window.cartUtils.getCart();
  const subtotal = window.cartUtils.getCartTotal();
  const shipping = subtotal >= 59 ? 0 : 5.90;
  const total = subtotal + shipping;

  orderItemsContainer.innerHTML = currentCart.map(item => `
    <div class="order-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
      <div class="order-item-details">
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(item.size)} • ${escapeHtml(item.color)} • Qté : ${parseInt(item.quantity, 10)}</p>
      </div>
      <span class="order-item-price">${(parseFloat(item.price) * parseInt(item.quantity, 10)).toFixed(2).replace('.', ',')} €</span>
    </div>
  `).join('');

  summarySubtotalEl.textContent = `${subtotal.toFixed(2).replace('.', ',')} €`;
  summaryShippingEl.textContent = shipping === 0 ? 'Gratuite' : `${shipping.toFixed(2).replace('.', ',')} €`;
  summaryTotalEl.textContent = `${total.toFixed(2).replace('.', ',')} €`;
}

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    customer_name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
    customer_email: document.getElementById('email').value,
    customer_phone: document.getElementById('phone').value,
    shipping_address: document.getElementById('address').value,
    shipping_city: document.getElementById('city').value,
    shipping_postal: document.getElementById('postal').value,
    items: window.cartUtils.getCart(),
    total: window.cartUtils.getCartTotal() + (window.cartUtils.getCartTotal() >= 59 ? 0 : 5.90)
  };

  const submitBtn = checkoutForm.querySelector('button[type="submit"]');

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Traitement...';

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la commande');
    }

    const result = await response.json();
    window.cartUtils.clearCart();
    window.location.href = `confirmation.html?order=${result.orderId}`;
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue. Veuillez réessayer.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Valider la commande';
  }
});

renderOrderSummary();
