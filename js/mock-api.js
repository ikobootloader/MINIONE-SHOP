(function () {
  const PRODUCTS_KEY = "mininione_demo_products";
  const ORDERS_KEY = "mininione_demo_orders";

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

  function buildOrder(body, products) {
    const orders = loadOrders();
    const id = nextId(orders);
    const normalizedItems = normalizeOrderItems(body.items, products);
    const total = calculateOrderTotal(normalizedItems);

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
      status: "pending",
      created_at: new Date().toISOString()
    };
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
      return jsonResponse({ success: true, orderId: order.id });
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
      loadProducts();
    }
  };
})();
