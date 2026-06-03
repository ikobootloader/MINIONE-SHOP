const API_BASE = '';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

const menuToggle = document.getElementById('menuToggle');
const navMobile = document.getElementById('navMobile');
const searchBtn = document.getElementById('searchBtn');
const searchModal = document.getElementById('searchModal');
const searchClose = document.getElementById('searchClose');
const searchInput = document.getElementById('searchInput');
const searchSubmit = document.getElementById('searchSubmit');
const wishlistBtn = document.getElementById('wishlistBtn');
const navDesktop = document.querySelector('.nav-desktop');
const headerIcons = document.querySelector('.header-icons');

function ensureNavLink(container) {
  if (!container || container.querySelector('[data-account-link="true"]')) {
    return;
  }

  const accountLink = document.createElement('a');
  accountLink.href = 'account.html';
  accountLink.textContent = 'Compte';
  accountLink.dataset.accountLink = 'true';
  container.appendChild(accountLink);
}

function ensureHeaderAccountLink() {
  if (!headerIcons || document.getElementById('accountBtn')) {
    return;
  }

  const accountLink = document.createElement('a');
  accountLink.href = 'account.html';
  accountLink.id = 'accountBtn';
  accountLink.className = 'account-link';
  accountLink.setAttribute('aria-label', 'Compte');
  accountLink.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
    <span id="loyaltyBadge" class="loyalty-badge">0</span>
  `;

  const cartLink = document.getElementById('cartBtn');
  if (cartLink) {
    headerIcons.insertBefore(accountLink, cartLink);
  } else {
    headerIcons.appendChild(accountLink);
  }
}

function updateLoyaltyBadgeDisplay(points) {
  const badge = document.getElementById('loyaltyBadge');
  if (!badge) return;

  const value = Number(points) || 0;
  badge.textContent = value > 999 ? '999+' : String(value);
  badge.style.display = value > 0 ? 'flex' : 'none';
}

function closeMobileNav() {
  navMobile?.classList.remove('open');
}

function closeSearchModal() {
  if (searchModal) {
    searchModal.style.display = 'none';
  }
}

if (menuToggle && navMobile) {
  menuToggle.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });

  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });
}

ensureNavLink(navDesktop);
ensureNavLink(navMobile);
ensureHeaderAccountLink();

if (searchBtn && searchModal) {
  searchBtn.addEventListener('click', () => {
    searchModal.style.display = 'flex';
    setTimeout(() => searchInput?.focus(), 100);
  });
}

if (searchClose) {
  searchClose.addEventListener('click', closeSearchModal);
}

if (searchModal) {
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      closeSearchModal();
    }
  });
}

if (searchSubmit) {
  searchSubmit.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `collection.html?search=${encodeURIComponent(query)}`;
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchSubmit?.click();
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMobileNav();
    closeSearchModal();
  }
});

function updateCartCount() {
  const cartCount = document.getElementById('cartCount');
  if (!cartCount) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

function addToCart(product, size, color, quantity = 1) {
  const existingItem = cart.find(
    item => item.id === product.id && item.size === size && item.color === color
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
      color,
      quantity
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showNotification('Produit ajouté au panier');
}

function removeFromCart(id, size, color) {
  cart = cart.filter(item => !(item.id === id && item.size === size && item.color === color));
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartItemQuantity(id, size, color, quantity) {
  const item = cart.find(
    currentItem => currentItem.id === id && currentItem.size === size && currentItem.color === color
  );

  if (!item) return;

  item.quantity = quantity;
  if (item.quantity <= 0) {
    removeFromCart(id, size, color);
    return;
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function clearCart() {
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function getCart() {
  return cart;
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateWishlistCount() {
  const wishlistCount = document.getElementById('wishlistCount');
  if (!wishlistCount) return;

  wishlistCount.textContent = wishlist.length;
  wishlistCount.style.display = wishlist.length > 0 ? 'flex' : 'none';
}

function isInWishlist(productId) {
  return wishlist.some(item => item.id === productId);
}

function toggleWishlist(product) {
  const index = wishlist.findIndex(item => item.id === product.id);

  if (index > -1) {
    wishlist.splice(index, 1);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    showNotification('Retiré des favoris');
    return false;
  }

  wishlist.push({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category
  });
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
  showNotification('Ajouté aux favoris');
  return true;
}

function removeFromWishlist(productId) {
  wishlist = wishlist.filter(item => item.id !== productId);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
}

function clearWishlist() {
  wishlist = [];
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
}

function getWishlist() {
  return wishlist;
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

async function refreshAccountUI() {
  try {
    const response = await fetch('/api/account');
    if (!response.ok) return;

    const data = await response.json();
    updateLoyaltyBadgeDisplay(data?.stats?.available_points || 0);
  } catch (error) {
    updateLoyaltyBadgeDisplay(0);
  }
}

if (wishlistBtn) {
  wishlistBtn.addEventListener('click', () => {
    window.location.href = 'wishlist.html';
  });
}

updateCartCount();
updateWishlistCount();
refreshAccountUI();

window.cartUtils = {
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  getCart,
  getCartTotal,
  updateCartCount
};

window.wishlistUtils = {
  toggleWishlist,
  removeFromWishlist,
  clearWishlist,
  getWishlist,
  isInWishlist,
  updateWishlistCount
};

window.showNotification = showNotification;
window.accountUtils = {
  refreshAccountUI
};
