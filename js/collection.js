// Fonction d'échappement HTML pour prévenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Récupération des paramètres URL
const urlParams = new URLSearchParams(window.location.search);
let currentFilters = {
  category: urlParams.get('category') || '',
  subcategory: urlParams.get('subcategory') || '',
  season: urlParams.get('season') || '',
  minPrice: urlParams.get('minPrice') || '',
  maxPrice: urlParams.get('maxPrice') || '',
  search: urlParams.get('search') || '',
  featured: urlParams.get('featured') || '',
  sort: urlParams.get('sort') || ''
};

// Éléments DOM
const filtersSidebar = document.getElementById('filtersSidebar');
const filterToggle = document.getElementById('filterToggle');
const clearFiltersBtn = document.getElementById('clearFilters');
const sortSelect = document.getElementById('sortSelect');
const productsGrid = document.getElementById('productsGrid');
const resultsCount = document.getElementById('resultsCount');
const pageTitle = document.getElementById('pageTitle');
const categoryFiltersContainer = document.getElementById('categoryFilters');
const subcategoryFiltersContainer = document.getElementById('subcategoryFilters');
const applyPriceBtn = document.getElementById('applyPrice');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');

// Toggle filters sur mobile
filterToggle?.addEventListener('click', () => {
  filtersSidebar.classList.toggle('open');
});

// Charger les catégories
async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const categories = await response.json();

    categoryFiltersContainer.innerHTML = categories.map(cat => `
      <label><input type="checkbox" name="category" value="${escapeHtml(cat)}" ${currentFilters.category === cat ? 'checked' : ''}> ${escapeHtml(cat)}</label>
    `).join('');

    // Event listeners pour les catégories
    categoryFiltersContainer.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        if (input.checked) {
          currentFilters.category = input.value;
          loadSubcategories(input.value);
          // Décocher les autres catégories
          categoryFiltersContainer.querySelectorAll('input').forEach(other => {
            if (other !== input) other.checked = false;
          });
        } else {
          currentFilters.category = '';
          currentFilters.subcategory = '';
          subcategoryFiltersContainer.innerHTML = '';
        }
        loadProducts();
      });
    });

    // Charger les sous-catégories si une catégorie est déjà sélectionnée
    if (currentFilters.category) {
      loadSubcategories(currentFilters.category);
    }
  } catch (error) {
    console.error('Erreur chargement catégories:', error);
  }
}

// Charger les sous-catégories
async function loadSubcategories(category) {
  try {
    const response = await fetch(`/api/subcategories?category=${encodeURIComponent(category)}`);
    const subcategories = await response.json();

    if (subcategories.length > 0) {
      subcategoryFiltersContainer.innerHTML = subcategories.map(sub => `
        <label><input type="checkbox" name="subcategory" value="${escapeHtml(sub)}" ${currentFilters.subcategory === sub ? 'checked' : ''}> ${escapeHtml(sub)}</label>
      `).join('');

      // Event listeners pour les sous-catégories
      subcategoryFiltersContainer.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          if (input.checked) {
            currentFilters.subcategory = input.value;
            // Décocher les autres sous-catégories
            subcategoryFiltersContainer.querySelectorAll('input').forEach(other => {
              if (other !== input) other.checked = false;
            });
          } else {
            currentFilters.subcategory = '';
          }
          loadProducts();
        });
      });
    } else {
      subcategoryFiltersContainer.innerHTML = '<p style="color:#78716c;font-size:13px;">Aucune sous-catégorie</p>';
    }
  } catch (error) {
    console.error('Erreur chargement sous-catégories:', error);
  }
}

// Event listeners pour les filtres de saison
document.querySelectorAll('input[name="season"]').forEach(input => {
  input.addEventListener('change', () => {
    if (input.checked) {
      currentFilters.season = input.value;
      // Décocher les autres saisons
      document.querySelectorAll('input[name="season"]').forEach(other => {
        if (other !== input) other.checked = false;
      });
    } else {
      currentFilters.season = '';
    }
    loadProducts();
  });

  // Pré-cocher si dans les filtres actuels
  if (input.value === currentFilters.season) {
    input.checked = true;
  }
});

// Event listener pour le tri
sortSelect.value = currentFilters.sort;
sortSelect.addEventListener('change', () => {
  currentFilters.sort = sortSelect.value;
  loadProducts();
});

// Event listener pour le prix
applyPriceBtn?.addEventListener('click', () => {
  currentFilters.minPrice = minPriceInput.value;
  currentFilters.maxPrice = maxPriceInput.value;
  loadProducts();
});

// Pré-remplir les champs de prix
if (currentFilters.minPrice) minPriceInput.value = currentFilters.minPrice;
if (currentFilters.maxPrice) maxPriceInput.value = currentFilters.maxPrice;

// Réinitialiser les filtres
clearFiltersBtn?.addEventListener('click', () => {
  currentFilters = {
    category: '',
    subcategory: '',
    season: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    featured: '',
    sort: ''
  };

  // Réinitialiser les inputs
  document.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);
  minPriceInput.value = '';
  maxPriceInput.value = '';
  sortSelect.value = '';

  // Recharger
  subcategoryFiltersContainer.innerHTML = '';
  loadProducts();
});

// Charger les produits
async function loadProducts() {
  try {
    productsGrid.innerHTML = '<div class="loading">Chargement...</div>';

    // Construire l'URL avec les filtres
    const params = new URLSearchParams();
    Object.keys(currentFilters).forEach(key => {
      if (currentFilters[key]) {
        params.append(key, currentFilters[key]);
      }
    });

    const response = await fetch(`/api/products?${params.toString()}`);
    const products = await response.json();

    // Mettre à jour le titre (textContent est sûr, pas d'innerHTML)
    if (currentFilters.category) {
      pageTitle.textContent = currentFilters.category;
    } else if (currentFilters.featured) {
      pageTitle.textContent = 'Nouveautés';
    } else if (currentFilters.search) {
      pageTitle.textContent = `Recherche : "${currentFilters.search}"`;
    } else {
      pageTitle.textContent = 'Collection';
    }

    // Afficher le nombre de résultats
    resultsCount.textContent = `${products.length} produit${products.length > 1 ? 's' : ''}`;

    // Afficher les produits
    if (products.length === 0) {
      productsGrid.innerHTML = '<div class="no-results"><p>Aucun produit trouvé</p><button onclick="clearFiltersBtn.click()" class="btn-primary">Réinitialiser les filtres</button></div>';
      return;
    }

    productsGrid.innerHTML = products.map(product => `
      <article class="product-card" onclick="window.location.href='product.html?id=${encodeURIComponent(product.id)}'">
        <div class="product-image">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
          ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}
          <button class="product-quick-view" onclick="event.stopPropagation(); window.location.href='product.html?id=${encodeURIComponent(product.id)}'">Aperçu rapide</button>
        </div>
        <div class="product-info">
          <h3>${escapeHtml(product.name)}</h3>
          <span>${parseFloat(product.price).toFixed(2).replace('.', ',')} €</span>
        </div>
      </article>
    `).join('');
  } catch (error) {
    console.error('Erreur chargement produits:', error);
    productsGrid.innerHTML = '<div class="error"><p>Erreur de chargement</p></div>';
  }
}

// Initialisation
loadCategories();
loadProducts();
