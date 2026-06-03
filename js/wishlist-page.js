// Fonction d'échappement HTML pour prévenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const wishlistContainer = document.getElementById('wishlistContainer');
const clearWishlistBtn = document.getElementById('clearWishlistBtn');

function renderWishlist() {
  const wishlist = window.wishlistUtils.getWishlist();

  if (wishlist.length === 0) {
    wishlistContainer.innerHTML = `
      <div class="empty-cart">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <h2>Votre liste de favoris est vide</h2>
        <p>Ajoutez vos produits préférés pour les retrouver facilement</p>
        <a href="collection.html" class="btn-primary">Découvrir la collection</a>
      </div>
    `;
    clearWishlistBtn.style.display = 'none';
    return;
  }

  clearWishlistBtn.style.display = 'block';

  wishlistContainer.innerHTML = `
    <div class="products-grid">
      ${wishlist.map(item => `
        <article class="product-card">
          <div class="product-image">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onclick="window.location.href='product.html?id=${encodeURIComponent(item.id)}'">
            <button class="wishlist-remove-btn" onclick="removeItem(${encodeURIComponent(item.id)})" aria-label="Retirer des favoris">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <button class="product-quick-view" onclick="window.location.href='product.html?id=${encodeURIComponent(item.id)}'">Voir le produit</button>
          </div>
          <div class="product-info">
            <h3 onclick="window.location.href='product.html?id=${encodeURIComponent(item.id)}'" style="cursor:pointer;">${escapeHtml(item.name)}</h3>
            <span>${parseFloat(item.price).toFixed(2).replace('.', ',')} €</span>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

function removeItem(productId) {
  if (confirm('Retirer ce produit de vos favoris ?')) {
    window.wishlistUtils.removeFromWishlist(productId);
    renderWishlist();
    window.showNotification('Retiré des favoris');
  }
}

clearWishlistBtn.addEventListener('click', () => {
  if (confirm('Voulez-vous vraiment vider votre liste de favoris ?')) {
    window.wishlistUtils.clearWishlist();
    renderWishlist();
    window.showNotification('Liste de favoris vidée');
  }
});

renderWishlist();
window.removeItem = removeItem;
