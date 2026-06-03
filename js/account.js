function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

const loyaltyCard = document.getElementById('loyaltyCard');
const accountOrders = document.getElementById('accountOrders');
const accountForm = document.getElementById('accountForm');

function formatDate(value) {
  if (!value) return 'Date indisponible';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getProgress(stats) {
  const total = Number(stats.available_points) || 0;
  const tier = stats.tier;

  if (tier === 'Icône') {
    return 100;
  }

  if (tier === 'Muse') {
    return Math.min(((total - 150) / 200) * 100, 100);
  }

  return Math.min((total / 150) * 100, 100);
}

function renderLoyaltyCard(data) {
  const { profile, stats } = data;
  const nextTierLabel = stats.next_tier ? `${stats.points_to_next_tier} points avant ${stats.next_tier}` : 'Palier maximal atteint';

  loyaltyCard.innerHTML = `
    <div class="account-loyalty-top">
      <div>
        <p class="account-kicker">Club Mininione</p>
        <div class="account-points-value">${stats.available_points}</div>
        <p>${profile.first_name ? `Bonjour ${escapeHtml(profile.first_name)}, ` : ''}vous disposez actuellement de <strong>${stats.available_points} points</strong>.</p>
      </div>
      <span class="account-tier-badge">${escapeHtml(stats.tier)}</span>
    </div>
    <div class="account-loyalty-grid">
      <div class="account-stat">
        <span>Points cumulés</span>
        <strong>${stats.lifetime_points}</strong>
      </div>
      <div class="account-stat">
        <span>Commandes</span>
        <strong>${stats.order_count}</strong>
      </div>
      <div class="account-stat">
        <span>Prochain palier</span>
        <strong>${stats.next_tier ? escapeHtml(stats.next_tier) : 'Atteint'}</strong>
      </div>
    </div>
    <div class="account-loyalty-progress">
      <div class="account-loyalty-progress-label">
        <span>Progression fidélité</span>
        <span>${escapeHtml(nextTierLabel)}</span>
      </div>
      <div class="account-progress-track">
        <div class="account-progress-bar" style="width: ${getProgress(stats)}%;"></div>
      </div>
      <p class="account-loyalty-note">Principe de démo : 1 point gagné par euro dépensé sur les articles de la commande, hors frais de livraison.</p>
    </div>
  `;
}

function renderOrders(orders) {
  if (!Array.isArray(orders) || orders.length === 0) {
    accountOrders.innerHTML = `
      <div class="account-empty">
        Aucune commande enregistrée pour le moment.<br>
        Passez une commande de démonstration pour voir les points se créditer ici.
      </div>
    `;
    return;
  }

  accountOrders.innerHTML = orders.map(order => `
    <article class="account-order-card">
      <div class="account-order-top">
        <div>
          <strong>Commande #${order.id}</strong>
          <div class="account-order-meta">
            <span>${formatDate(order.created_at)}</span>
            <span>${order.item_count} article${order.item_count > 1 ? 's' : ''}</span>
            <span>${Number(order.total).toFixed(2).replace('.', ',')} €</span>
          </div>
        </div>
        <span class="status-badge status-${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
      </div>
      <div class="account-order-points">+${Number(order.loyalty_points_earned) || 0} points fidélité</div>
    </article>
  `).join('');
}

function fillProfile(profile) {
  document.getElementById('firstName').value = profile.first_name || '';
  document.getElementById('lastName').value = profile.last_name || '';
  document.getElementById('email').value = profile.email || '';
  document.getElementById('phone').value = profile.phone || '';
  document.getElementById('address').value = profile.address || '';
  document.getElementById('city').value = profile.city || '';
  document.getElementById('postal').value = profile.postal || '';
}

async function loadAccountPage() {
  try {
    const response = await fetch('/api/account');
    if (!response.ok) {
      throw new Error('Impossible de charger le compte');
    }

    const data = await response.json();
    renderLoyaltyCard(data);
    renderOrders(data.orders);
    fillProfile(data.profile);
  } catch (error) {
    loyaltyCard.innerHTML = '<p>Erreur de chargement du compte.</p>';
    accountOrders.innerHTML = '<p>Erreur de chargement des commandes.</p>';
  }
}

accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    first_name: document.getElementById('firstName').value.trim(),
    last_name: document.getElementById('lastName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim(),
    postal: document.getElementById('postal').value.trim()
  };

  const submitButton = accountForm.querySelector('button[type="submit"]');
  const initialLabel = submitButton.textContent;

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Enregistrement...';

    const response = await fetch('/api/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erreur de sauvegarde');
    }

    const data = await response.json();
    renderLoyaltyCard(data);
    renderOrders(data.orders);
    window.showNotification('Profil mis à jour');
    window.accountUtils?.refreshAccountUI();
  } catch (error) {
    window.showNotification('Impossible d’enregistrer le profil', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = initialLabel;
  }
});

loadAccountPage();
