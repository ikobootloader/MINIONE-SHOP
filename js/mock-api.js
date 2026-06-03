(function () {
  const PRODUCTS_KEY = "mininione_demo_products";
  const ORDERS_KEY = "mininione_demo_orders";
  const ACCOUNT_KEY = "mininione_demo_account";

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function isoFromIndex(index) {
    const base = Date.UTC(2026, 4, 1, 12, 0, 0);
    return new Date(base + index * 60000).toISOString();
  }

  function normalizeProduct(product, index) {
    const parsedPrice = Number(product.price);
    const parsedStock = Number(product.stock);
    const normalizedFeatured = [1, "1", true].includes(product.featured) ? 1 : 0;

    return {
      id: Number(product.id),
      name: product.name,
      price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
      description: product.description || "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      season: product.season || "Toutes saisons",
      sizes: typeof product.sizes === "string" ? product.sizes : JSON.stringify(product.sizes || []),
      colors: typeof product.colors === "string" ? product.colors : JSON.stringify(product.colors || []),
      material: product.material || "",
      badge: product.badge || null,
      image: product.image,
      images: typeof product.images === "string" ? product.images : JSON.stringify(product.images || [product.image]),
      stock: Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : 100,
      featured: normalizedFeatured,
      created_at: product.created_at || isoFromIndex(index)
    };
  }

  function loadProducts() {
    const stored = safeJsonParse(localStorage.getItem(PRODUCTS_KEY), null);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored.map(normalizeProduct);
    }

    const seeded = (window.MININIONE_DEMO_PRODUCTS || []).map(normalizeProduct);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products.map(normalizeProduct)));
  }

  function loadOrders() {
    const stored = safeJsonParse(localStorage.getItem(ORDERS_KEY), []);
    return Array.isArray(stored) ? stored : [];
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function getTier(points) {
    if (points >= 350) {
      return { name: "Icône", min: 350, next: null };
    }

    if (points >= 150) {
      return { name: "Muse", min: 150, next: 350 };
    }

    return { name: "Atelier", min: 0, next: 150 };
  }

  function buildEmptyAccount() {
    return {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postal: "",
      loyalty_points: 0,
      lifetime_points: 0,
      order_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  function normalizeAccount(account) {
    const base = buildEmptyAccount();
    const normalized = {
      ...base,
      ...(account || {})
    };

    normalized.loyalty_points = Number(normalized.loyalty_points) || 0;
    normalized.lifetime_points = Number(normalized.lifetime_points) || 0;
    normalized.order_count = Number(normalized.order_count) || 0;
    normalized.updated_at = normalized.updated_at || new Date().toISOString();
    normalized.created_at = normalized.created_at || normalized.updated_at;

    return normalized;
  }

  function loadAccount() {
    return normalizeAccount(safeJsonParse(localStorage.getItem(ACCOUNT_KEY), null));
  }

  function saveAccount(account) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(normalizeAccount(account)));
  }

  function splitCustomerName(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { firstName: "", lastName: "" };
    }

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" ")
    };
  }

  function summarizeOrder(order) {
    const items = safeJsonParse(order.items, []);
    const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    return {
      id: Number(order.id),
      total: Number(order.total) || 0,
      status: order.status || "pending",
      created_at: order.created_at,
      loyalty_points_earned: Number(order.loyalty_points_earned) || 0,
      item_count: itemCount
    };
  }

  function buildAccountPayload(account, orders) {
    const normalizedAccount = normalizeAccount(account);
    const tier = getTier(normalizedAccount.loyalty_points);
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6)
      .map(summarizeOrder);

    return {
      profile: normalizedAccount,
      stats: {
        available_points: normalizedAccount.loyalty_points,
        lifetime_points: normalizedAccount.lifetime_points,
        order_count: normalizedAccount.order_count,
        tier: tier.name,
        next_tier: tier.next ? getTier(tier.next).name : null,
        points_to_next_tier: tier.next ? Math.max(tier.next - normalizedAccount.loyalty_points, 0) : 0
      },
      orders: recentOrders
    };
  }

  function nextId(items) {
    return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  }

  function jsonResponse(data, status) {
    return Promise.resolve(new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { "Content-Type": "application/json" }
    }));
  }

  function getUrlParts(input) {
    const rawUrl = typeof input === "string" ? input : input.url;

    if (typeof rawUrl === "string") {
      if (rawUrl.startsWith("/api/")) {
        const [pathname, query = ""] = rawUrl.split("?");
        return { pathname, searchParams: new URLSearchParams(query) };
      }

      if (rawUrl.startsWith("api/")) {
        const [path, query = ""] = rawUrl.split("?");
        return { pathname: `/${path}`, searchParams: new URLSearchParams(query) };
      }
    }

    const url = new URL(rawUrl, window.location.href);

    if (url.protocol === "file:" && url.pathname.includes("/api/")) {
      const apiPath = url.pathname.slice(url.pathname.indexOf("/api/"));
      return { pathname: apiPath, searchParams: url.searchParams };
    }

    return { pathname: url.pathname, searchParams: url.searchParams };
  }

  function matchesSearch(product, search) {
    if (!search) return true;
    const query = search.toLowerCase();
    return product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query);
  }

  function filterProducts(products, params) {
    let filtered = [...products];
    const category = params.get("category");
    const subcategory = params.get("subcategory");
    const season = params.get("season");
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    const search = params.get("search");
    const sort = params.get("sort");
    const featured = params.get("featured");

    if (category) filtered = filtered.filter((product) => product.category === category);
    if (subcategory) filtered = filtered.filter((product) => product.subcategory === subcategory);
    if (season && season !== "Toutes saisons") {
      filtered = filtered.filter((product) => product.season === season || product.season === "Toutes saisons");
    }
    if (minPrice) filtered = filtered.filter((product) => product.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter((product) => product.price <= Number(maxPrice));
    if (search) filtered = filtered.filter((product) => matchesSearch(product, search));
    if (featured) filtered = filtered.filter((product) => Number(product.featured) === 1);

    if (sort === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    } else {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }

  function normalizeOrderItems(rawItems, products) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new Error("Articles invalides");
    }

    return rawItems.map((item) => {
      const productId = Number(item?.id);
      const quantity = Number(item?.quantity);
      const size = typeof item?.size === "string" ? item.size.trim() : "";
      const color = typeof item?.color === "string" ? item.color.trim() : "";
      const product = products.find((entry) => entry.id === productId);

      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 || !size || !color) {
        throw new Error("Articles invalides");
      }

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size,
        color,
        quantity
      };
    });
  }

  function calculateOrderTotal(items) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 59 ? 0 : 5.9;
    return Number((subtotal + shipping).toFixed(2));
  }

  function calculateOrderSubtotal(items) {
    return Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  }

  function calculateLoyaltyPoints(subtotal) {
    return Math.max(Math.floor(Number(subtotal) || 0), 0);
  }

  function buildOrder(body, products) {
    const orders = loadOrders();
    const id = nextId(orders);
    const normalizedItems = normalizeOrderItems(body.items, products);
    const subtotal = calculateOrderSubtotal(normalizedItems);
    const total = calculateOrderTotal(normalizedItems);
    const loyaltyPointsEarned = calculateLoyaltyPoints(subtotal);

    return {
      id,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone || "",
      shipping_address: body.shipping_address,
      shipping_city: body.shipping_city,
      shipping_postal: body.shipping_postal,
      items: JSON.stringify(normalizedItems),
      total,
      subtotal,
      loyalty_points_earned: loyaltyPointsEarned,
      status: "pending",
      created_at: new Date().toISOString()
    };
  }

  function updateAccountFromOrder(order) {
    const currentAccount = loadAccount();
    const { firstName, lastName } = splitCustomerName(order.customer_name);
    const updatedAccount = normalizeAccount({
      ...currentAccount,
      first_name: firstName || currentAccount.first_name,
      last_name: lastName || currentAccount.last_name,
      email: order.customer_email || currentAccount.email,
      phone: order.customer_phone || currentAccount.phone,
      address: order.shipping_address || currentAccount.address,
      city: order.shipping_city || currentAccount.city,
      postal: order.shipping_postal || currentAccount.postal,
      loyalty_points: currentAccount.loyalty_points + (Number(order.loyalty_points_earned) || 0),
      lifetime_points: currentAccount.lifetime_points + (Number(order.loyalty_points_earned) || 0),
      order_count: currentAccount.order_count + 1,
      updated_at: new Date().toISOString()
    });

    saveAccount(updatedAccount);
    return updatedAccount;
  }

  async function handleApiRequest(input, init) {
    const method = (init?.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
    const { pathname, searchParams } = getUrlParts(input);
    const products = loadProducts();

    if (pathname === "/api/products" && method === "GET") {
      return jsonResponse(filterProducts(products, searchParams));
    }

    if (pathname.startsWith("/api/products/") && method === "GET") {
      const id = Number(pathname.split("/").pop());
      const product = products.find((item) => item.id === id);
      return product ? jsonResponse(product) : jsonResponse({ error: "Produit non trouvé" }, 404);
    }

    if (pathname === "/api/categories" && method === "GET") {
      const categories = [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, "fr"));
      return jsonResponse(categories);
    }

    if (pathname === "/api/subcategories" && method === "GET") {
      const category = searchParams.get("category");
      const subcategories = products
        .filter((product) => !category || product.category === category)
        .map((product) => product.subcategory)
        .filter(Boolean);
      return jsonResponse([...new Set(subcategories)].sort((a, b) => a.localeCompare(b, "fr")));
    }

    if (pathname === "/api/orders" && method === "GET") {
      const orders = loadOrders().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return jsonResponse(orders.map((order) => ({ ...order, total: Number(order.total) })));
    }

    if (pathname.startsWith("/api/orders/") && method === "GET") {
      const id = Number(pathname.split("/").pop());
      const order = loadOrders().find((item) => Number(item.id) === id);
      return order ? jsonResponse({ ...order, total: Number(order.total) }) : jsonResponse({ error: "Commande non trouvée" }, 404);
    }

    if (pathname === "/api/orders" && method === "POST") {
      const body = safeJsonParse(init?.body || "{}", {});
      const orders = loadOrders();
      const order = buildOrder(body, products);
      orders.push(order);
      saveOrders(orders);
      const account = updateAccountFromOrder(order);
      return jsonResponse({
        success: true,
        orderId: order.id,
        loyaltyPointsEarned: Number(order.loyalty_points_earned) || 0,
        loyaltyPointsBalance: Number(account.loyalty_points) || 0
      });
    }

    if (pathname === "/api/account" && method === "GET") {
      return jsonResponse(buildAccountPayload(loadAccount(), loadOrders()));
    }

    if (pathname === "/api/account" && method === "PUT") {
      const body = safeJsonParse(init?.body || "{}", {});
      const currentAccount = loadAccount();
      const updatedAccount = normalizeAccount({
        ...currentAccount,
        first_name: body.first_name ?? currentAccount.first_name,
        last_name: body.last_name ?? currentAccount.last_name,
        email: body.email ?? currentAccount.email,
        phone: body.phone ?? currentAccount.phone,
        address: body.address ?? currentAccount.address,
        city: body.city ?? currentAccount.city,
        postal: body.postal ?? currentAccount.postal,
        updated_at: new Date().toISOString()
      });

      saveAccount(updatedAccount);
      return jsonResponse(buildAccountPayload(updatedAccount, loadOrders()));
    }

    if (pathname === "/api/admin/products" && method === "POST") {
      const body = safeJsonParse(init?.body || "{}", {});
      const nextProduct = normalizeProduct({
        ...body,
        id: nextId(products),
        created_at: new Date().toISOString()
      });
      products.push(nextProduct);
      saveProducts(products);
      return jsonResponse({ success: true, productId: nextProduct.id });
    }

    if (pathname.startsWith("/api/admin/products/") && method === "PUT") {
      const id = Number(pathname.split("/").pop());
      const body = safeJsonParse(init?.body || "{}", {});
      const index = products.findIndex((item) => item.id === id);
      if (index === -1) {
        return jsonResponse({ error: "Produit non trouvé" }, 404);
      }

      products[index] = normalizeProduct({
        ...products[index],
        ...body,
        id
      }, index);

      saveProducts(products);
      return jsonResponse({ success: true });
    }

    if (pathname.startsWith("/api/admin/products/") && method === "DELETE") {
      const id = Number(pathname.split("/").pop());
      const filtered = products.filter((item) => item.id !== id);
      if (filtered.length === products.length) {
        return jsonResponse({ error: "Produit non trouvé" }, 404);
      }

      saveProducts(filtered);
      return jsonResponse({ success: true });
    }

    return null;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input, init) {
    const { pathname } = getUrlParts(input);
    if (pathname.startsWith("/api/")) {
      const response = await handleApiRequest(input, init);
      if (response) return response;
    }
    return originalFetch(input, init);
  };

  window.MININIONE_DEMO_API = {
    reset() {
      localStorage.removeItem(PRODUCTS_KEY);
      localStorage.removeItem(ORDERS_KEY);
      localStorage.removeItem(ACCOUNT_KEY);
      loadProducts();
    }
  };
})();
