const illustrationPaths = {
  "p-100": [
    { d: "M41 38c0-11 8-19 19-19s19 8 19 19l13 12 7 46H21l7-46 13-12Z", fill: "#71806a" },
    { d: "M41 39c0 11 7 18 19 18s19-7 19-18M32 54h56M42 68h36v22H42z", stroke: "#e8eadc", width: 3 },
    { d: "M51 19c0-8 18-8 18 0", stroke: "#52614e", width: 4 },
  ],
  "p-101": [
    { d: "M37 28h46l-4 13H41l-4-13Zm5 13h36l7 53H35l7-53Z", fill: "#b66e50" },
    { d: "M42 29h36M46 53h29M48 76h25", stroke: "#ecd7c6", width: 3 },
    { d: "M82 49c22-2 22 30 0 31", stroke: "#a35f47", width: 7 },
  ],
  "p-102": [
    { d: "M34 94h53c-2 7-9 10-26 10s-25-3-27-10Z", fill: "#61768a" },
    { d: "m59 92 6-39 12-20", stroke: "#667b8e", width: 6 },
    { d: "M68 28 88 17l13 18-27 10z", fill: "#8fa1ad" },
    { d: "M74 47 91 37", stroke: "#f3e7cf", width: 2 },
  ],
};

const validProductIds = new Set(Object.keys(illustrationPaths));
const bagStorageKey = "morrow-demo-bag-v1";
let bag = readBag();

function readBag() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(bagStorageKey) || "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    return Object.fromEntries(
      Object.entries(stored).filter(([id, quantity]) =>
        validProductIds.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 20,
      ),
    );
  } catch {
    return {};
  }
}

function saveBag() {
  try {
    window.localStorage.setItem(bagStorageKey, JSON.stringify(bag));
  } catch {
    // Bag controls continue to work for this page if browser storage is unavailable.
  }
  updateBagCount();
}

function itemCount() {
  return Object.values(bag).reduce((total, quantity) => total + quantity, 0);
}

function updateBagCount() {
  const count = document.querySelector("#bag-count");
  const link = document.querySelector(".bag-link");
  if (count) count.textContent = String(itemCount());
  if (link) link.setAttribute("aria-label", `Shopping bag, ${itemCount()} ${itemCount() === 1 ? "item" : "items"}`);
}

function addToBag(productId) {
  if (!validProductIds.has(productId)) return false;
  bag[productId] = Math.min((bag[productId] || 0) + 1, 20);
  saveBag();
  return true;
}

function makeIllustration(productId) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 120 120");
  svg.setAttribute("aria-hidden", "true");
  for (const shape of illustrationPaths[productId] || []) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", shape.d);
    path.setAttribute("fill", shape.fill || "none");
    path.setAttribute("stroke", shape.stroke || "none");
    path.setAttribute("stroke-width", String(shape.width || 0));
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
  }
  return svg;
}

function makeProductCard(product, index) {
  const card = document.createElement("article");
  card.className = "product-card";
  const art = document.createElement("div");
  art.className = `product-art tone-${(index % 3) + 1}`;
  art.append(makeIllustration(product.id));

  const info = document.createElement("div");
  info.className = "product-info";
  const topLine = document.createElement("div");
  topLine.className = "product-topline";
  const name = document.createElement("a");
  name.className = "product-name product-name-link";
  name.href = `/product/${encodeURIComponent(product.id)}`;
  name.textContent = product.name;
  const price = document.createElement("span");
  price.className = "product-price";
  price.textContent = `$${Number(product.price).toFixed(2)}`;
  topLine.append(name, price);

  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = product.category;
  const description = document.createElement("p");
  description.className = "product-description";
  description.textContent = product.description;
  const actions = document.createElement("div");
  actions.className = "product-actions";
  const details = document.createElement("a");
  details.className = "text-link product-details-link";
  details.href = `/product/${encodeURIComponent(product.id)}`;
  details.textContent = "Details";
  const addButton = document.createElement("button");
  addButton.className = "add-button";
  addButton.type = "button";
  addButton.setAttribute("aria-label", `Add ${product.name} to bag`);
  addButton.textContent = "Add to bag  +";
  addButton.addEventListener("click", () => {
    if (!addToBag(product.id)) return;
    addButton.textContent = "Added to bag";
    window.setTimeout(() => { addButton.textContent = "Add to bag  +"; }, 900);
  });

  actions.append(details, addButton);
  info.append(topLine, category, description, actions);
  card.append(art, info);
  return card;
}

async function fetchProducts(params = new URLSearchParams()) {
  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) throw new Error("Could not load products.");
  const data = await response.json();
  return Array.isArray(data.products) ? data.products : [];
}

function showLoadError(container, message) {
  if (!container) return;
  container.textContent = message;
  if ("hidden" in container) container.hidden = false;
}

function setupShop() {
  const grid = document.querySelector("#product-grid");
  const homeGrid = document.querySelector("#home-featured");
  if (!grid && !homeGrid) return;

  const searchInput = document.querySelector("#search-input");
  const emptyState = document.querySelector("#empty-state");
  const resultCount = document.querySelector("#result-count");
  const sortSelect = document.querySelector("#sort-select");
  const filterButtons = document.querySelectorAll(".filter-chip");
  const pageParams = new URLSearchParams(window.location.search);
  let activeCategory = "all";
  let timer;

  if (searchInput && pageParams.has("q")) searchInput.value = pageParams.get("q").slice(0, 100);

  async function render() {
    const params = new URLSearchParams();
    if (searchInput?.value.trim()) params.set("q", searchInput.value.trim());
    if (activeCategory !== "all") params.set("category", activeCategory);
    let products = await fetchProducts(params);
    if (sortSelect?.value === "price-asc") products.sort((a, b) => a.price - b.price);
    if (sortSelect?.value === "price-desc") products.sort((a, b) => b.price - a.price);
    const target = grid || homeGrid;
    if (!target) return;
    target.replaceChildren();
    if (homeGrid && !grid) products = products.slice(0, Number(homeGrid.dataset.productLimit) || 3);
    products.forEach((product, index) => target.append(makeProductCard(product, index)));
    if (emptyState) emptyState.hidden = products.length > 0;
    if (resultCount) resultCount.textContent = `${String(products.length).padStart(2, "0")} ${products.length === 1 ? "piece" : "pieces"}`;
  }

  function scheduleRender() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => render().catch(() => showLoadError(emptyState, "The collection couldn't load. Refresh the page to try again.")), 140);
  }

  searchInput?.addEventListener("input", scheduleRender);
  sortSelect?.addEventListener("change", () => render().catch(() => showLoadError(emptyState, "The collection couldn't load.")));
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "all";
      filterButtons.forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle("is-active", selected);
        filter.setAttribute("aria-pressed", String(selected));
      });
      scheduleRender();
    });
  });
  render().catch(() => showLoadError(emptyState || grid || homeGrid, "The collection couldn't load. Refresh the page to try again."));
}

function setupProductDetail() {
  const art = document.querySelector("[data-product-art]");
  const addButton = document.querySelector("[data-add-product]");
  if (art) art.replaceChildren(makeIllustration(art.dataset.productArt));
  addButton?.addEventListener("click", () => {
    if (!addToBag(addButton.dataset.addProduct)) return;
    const feedback = document.querySelector("#detail-feedback");
    if (feedback) feedback.textContent = "Added to your demo bag. No order has been placed.";
  });
}

async function setupBag() {
  const container = document.querySelector("#bag-items");
  if (!container) return;
  const empty = document.querySelector("#bag-empty");
  const subtotalNode = document.querySelector("#bag-subtotal");
  const totalNode = document.querySelector("#bag-total");
  const checkoutLink = document.querySelector("#checkout-link");
  try {
    const products = await fetchProducts();
    const productMap = new Map(products.map((product) => [product.id, product]));
    container.replaceChildren();
    let subtotal = 0;
    for (const [id, quantity] of Object.entries(bag)) {
      const product = productMap.get(id);
      if (!product) continue;
      subtotal += product.price * quantity;
      const row = document.createElement("article");
      row.className = "bag-row";
      const art = document.createElement("div");
      art.className = "bag-art tone-1";
      art.append(makeIllustration(id));
      const detail = document.createElement("div");
      detail.className = "bag-item-detail";
      const name = document.createElement("a");
      name.href = `/product/${encodeURIComponent(id)}`;
      name.textContent = product.name;
      const category = document.createElement("p");
      category.textContent = product.category;
      const quantityControls = document.createElement("div");
      quantityControls.className = "quantity-controls";
      const decrement = document.createElement("button");
      decrement.type = "button";
      decrement.setAttribute("aria-label", `Remove one ${product.name}`);
      decrement.textContent = "−";
      const quantityText = document.createElement("span");
      quantityText.textContent = String(quantity);
      const increment = document.createElement("button");
      increment.type = "button";
      increment.setAttribute("aria-label", `Add one ${product.name}`);
      increment.textContent = "+";
      decrement.addEventListener("click", () => changeQuantity(id, -1));
      increment.addEventListener("click", () => changeQuantity(id, 1));
      quantityControls.append(decrement, quantityText, increment);
      detail.append(name, category, quantityControls);
      const lineTotal = document.createElement("span");
      lineTotal.className = "bag-line-total";
      lineTotal.textContent = `$${(product.price * quantity).toFixed(2)}`;
      const remove = document.createElement("button");
      remove.className = "remove-item";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        delete bag[id];
        saveBag();
        setupBag();
      });
      row.append(art, detail, lineTotal, remove);
      container.append(row);
    }
    const isEmpty = container.childElementCount === 0;
    if (empty) empty.hidden = !isEmpty;
    if (subtotalNode) subtotalNode.textContent = `$${subtotal.toFixed(2)}`;
    if (totalNode) totalNode.textContent = `$${subtotal.toFixed(2)}`;
    if (checkoutLink) checkoutLink.setAttribute("aria-disabled", String(isEmpty));
  } catch {
    showLoadError(container, "The bag couldn't load. Refresh the page to try again.");
  }
}

function changeQuantity(id, adjustment) {
  const next = (bag[id] || 0) + adjustment;
  if (next <= 0) delete bag[id];
  else bag[id] = Math.min(next, 20);
  saveBag();
  setupBag();
}

async function setupCheckout() {
  const container = document.querySelector("#checkout-items");
  if (!container) return;
  const totalNode = document.querySelector("#checkout-total");
  const placeButton = document.querySelector("#place-demo-order");
  const confirmation = document.querySelector("#order-confirmation");
  try {
    const products = await fetchProducts();
    const productMap = new Map(products.map((product) => [product.id, product]));
    container.replaceChildren();
    let total = 0;
    for (const [id, quantity] of Object.entries(bag)) {
      const product = productMap.get(id);
      if (!product) continue;
      total += product.price * quantity;
      const row = document.createElement("p");
      row.className = "checkout-item";
      const label = document.createElement("span");
      label.textContent = `${product.name} × ${quantity}`;
      const price = document.createElement("strong");
      price.textContent = `$${(product.price * quantity).toFixed(2)}`;
      row.append(label, price);
      container.append(row);
    }
    if (container.childElementCount === 0) {
      const note = document.createElement("p");
      note.textContent = "Your demo bag is empty. Add an item before continuing.";
      container.append(note);
    }
    if (totalNode) totalNode.textContent = `$${total.toFixed(2)}`;
    if (placeButton) placeButton.disabled = total === 0;
  } catch {
    showLoadError(container, "Your demo checkout couldn't load. Refresh the page to try again.");
    if (placeButton) placeButton.disabled = true;
  }

  placeButton?.addEventListener("click", () => {
    bag = {};
    saveBag();
    container.replaceChildren();
    const message = document.createElement("p");
    message.textContent = "Your demo checkout is complete. No payment was taken and no order was created.";
    confirmation?.replaceChildren(message);
    if (confirmation) confirmation.hidden = false;
    placeButton.disabled = true;
    if (totalNode) totalNode.textContent = "$0.00";
  });
}

function setupContact() {
  const form = document.querySelector("#contact-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    form.reset();
    const response = document.querySelector("#contact-response");
    if (response) response.textContent = "Preview only: your message was cleared and was not sent or saved.";
  });
}

function setupChat() {
  const form = document.querySelector("#chat-form");
  if (!form) return;
  const input = document.querySelector("#chat-input");
  const responseNode = document.querySelector("#chat-response");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    responseNode.textContent = "One moment…";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Guide unavailable");
      responseNode.textContent = data.reply;
      input.value = "";
    } catch {
      responseNode.textContent = "The shop guide isn't available just now. Try the collection search instead.";
    }
  });
}

updateBagCount();
setupShop();
setupProductDetail();
setupBag();
setupCheckout();
setupContact();
setupChat();
