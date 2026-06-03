// Variables globales
const API_BASE = '';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// Gestion du menu mobile
const menuToggle = document.getElementById('menuToggle');
const navMobile = document.getElementById('navMobile');

if (menuToggle && navMobile) {
  menuToggle.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });
}

// Gestion de la recherche
const searchBtn = document.getElementById('searchBtn');
const searchModal = document.getElementById('searchModal');
const searchClose = document.getElementById('searchClose');
const searchInput = document.getElementById('searchInput');
const searchSubmit = document.getElementById('searchSubmit');

if (searchBtn && searchModal) {
  searchBtn.addEventListener('click', () => {
    searchModal.style.display = 'flex';
    setTimeout(() => searchInput?.focus(), 100);
  });
}

if (searchClose && searchModal) {
  searchClose.addEventListener('click', () => {
    searchModal.style.display = 'none';
  });
}

if (searchModal) {
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      searchModal.style.display = 'none';
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

// Gestion du panier
function updateCartCount() {
  const cartCount = document.getElementById('cartCount');
  if (cartCount) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
  }
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
  cart = cart.filter(
    item => !(item.id === id && item.size === size && item.color === color)
  );
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartItemQuantity(id, size, color, quantity) {
  const item = cart.find(
    item => item.id === id && item.size === size && item.color === color
  );
  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      removeFromCart(id, size, color);
    } else {
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
    }
  }
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

// Gestion de la wishlist
function updateWishlistCount() {
  const wishlistCount = document.getElementById('wishlistCount');
  if (wishlistCount) {
    wishlistCount.textContent = wishlist.length;
    wishlistCount.style.display = wishlist.length > 0 ? 'flex' : 'none';
  }
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
  } else {
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

// Notification
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

// Event listener pour le bouton wishlist du header
const wishlistBtn = document.getElementById('wishlistBtn');
if (wishlistBtn) {
  wishlistBtn.addEventListener('click', () => {
    window.location.href = 'wishlist.html';
  });
}

// Initialisation
updateCartCount();
updateWishlistCount();

// Export pour utilisation dans d'autres fichiers
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
