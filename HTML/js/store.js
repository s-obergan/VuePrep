/* ==========================================================================
   Northwind Supply — catalogue + cart store
   Classic script (no ES modules) so the pages also work over file://.

   `cart` below is deliberately shaped like the Pinia store it becomes in the
   Nuxt build, so the port is a rename rather than a rewrite:

     state    items
     getters  lines, count, subtotal, shipping, total
     actions  add, remove            (the two the spec calls for)
              setQty, clear         (UI conveniences built on the same two)

   Exposes globals: PRODUCTS, formatPrice, getProduct, escapeHtml, cart, toast
   ========================================================================== */

/* ---------- Catalogue ----------------------------------------------------- */

var PRODUCTS = [
  {
    id: 'aurora-desk-lamp',
    name: 'Aurora Desk Lamp',
    category: 'Lighting',
    price: 79.0,
    image: 'assets/products/aurora-desk-lamp.svg',
    stock: 12
  },
  {
    id: 'nordic-ceramic-mug',
    name: 'Nordic Ceramic Mug',
    category: 'Kitchen',
    price: 18.5,
    image: 'assets/products/nordic-ceramic-mug.svg',
    stock: 40
  },
  {
    id: 'linen-throw-blanket',
    name: 'Washed Linen Throw',
    category: 'Textiles',
    price: 64.0,
    image: 'assets/products/linen-throw-blanket.svg',
    stock: 7
  },
  {
    id: 'terra-planter-set',
    name: 'Terra Planter Set',
    category: 'Garden',
    price: 34.0,
    image: 'assets/products/terra-planter-set.svg',
    stock: 22
  },
  {
    id: 'meridian-wall-clock',
    name: 'Meridian Wall Clock',
    category: 'Home',
    price: 52.0,
    image: 'assets/products/meridian-wall-clock.svg',
    stock: 15
  },
  {
    id: 'canvas-weekender-bag',
    name: 'Canvas Weekender',
    category: 'Bags',
    price: 98.0,
    image: 'assets/products/canvas-weekender-bag.svg',
    stock: 5
  },
  {
    id: 'pour-over-carafe',
    name: 'Pour-Over Carafe',
    category: 'Kitchen',
    price: 41.0,
    image: 'assets/products/pour-over-carafe.svg',
    stock: 18
  },
  {
    id: 'field-notebook-duo',
    name: 'Field Notebook Duo',
    category: 'Stationery',
    price: 14.0,
    image: 'assets/products/field-notebook-duo.svg',
    stock: 60
  }
];

/* ---------- Shipping rules ------------------------------------------------ */

var SHIPPING_FLAT = 4.95;
var FREE_SHIPPING_FROM = 75;

/* ---------- Formatting helpers -------------------------------------------- */

var priceFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
});

function formatPrice(value) {
  return priceFormatter.format(value);
}

function getProduct(id) {
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === id) return PRODUCTS[i];
  }
  return null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

/* ---------- Cart store ---------------------------------------------------- */

var CART_KEY = 'enbw-cart';

/* state — an array of { id, qty }. Everything else is looked up in PRODUCTS. */
function readItems() {
  try {
    var raw = localStorage.getItem(CART_KEY);
    var parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(function (line) {
        return line && typeof line.id === 'string' && getProduct(line.id) && line.qty > 0;
      })
      .map(function (line) {
        return { id: line.id, qty: Math.min(line.qty, getProduct(line.id).stock) };
      });
  } catch (err) {
    return [];
  }
}

function commit(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  renderCartCount();
}

var cart = {
  /* --- getters ---------------------------------------------------------- */

  /** The raw state. */
  items: readItems,

  /** Cart lines joined with their catalogue record, ready to render. */
  lines: function () {
    return readItems().map(function (line) {
      var product = getProduct(line.id);
      return {
        id: line.id,
        qty: line.qty,
        product: product,
        lineTotal: product.price * line.qty
      };
    });
  },

  count: function () {
    return readItems().reduce(function (sum, line) {
      return sum + line.qty;
    }, 0);
  },

  subtotal: function () {
    return cart.lines().reduce(function (sum, line) {
      return sum + line.lineTotal;
    }, 0);
  },

  shipping: function () {
    var subtotal = cart.subtotal();
    if (subtotal === 0) return 0;
    return subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FLAT;
  },

  total: function () {
    return cart.subtotal() + cart.shipping();
  },

  /* --- actions ---------------------------------------------------------- */

  /** Add `qty` of a product, merging into an existing line. Clamped to stock. */
  add: function (id, qty) {
    var product = getProduct(id);
    if (!product) return;

    qty = Math.max(1, parseInt(qty, 10) || 1);
    var items = readItems();
    var found = null;

    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) found = items[i];
    }

    if (found) {
      found.qty = Math.min(product.stock, found.qty + qty);
    } else {
      items.push({ id: id, qty: Math.min(product.stock, qty) });
    }

    commit(items);
  },

  /** Remove a product's line entirely. */
  remove: function (id) {
    commit(
      readItems().filter(function (line) {
        return line.id !== id;
      })
    );
  },

  /**
   * Set an absolute quantity. Removing at zero falls through to `remove`.
   *
   * Conceptually this is remove-then-add, but it is written directly so the
   * line keeps its position in the cart — reordering rows the moment someone
   * edits a quantity is disorienting, and it would move focus targets.
   */
  setQty: function (id, qty) {
    qty = parseInt(qty, 10) || 0;

    if (qty < 1) {
      cart.remove(id);
      return;
    }

    var product = getProduct(id);
    if (!product) return;

    commit(
      readItems().map(function (line) {
        if (line.id === id) line.qty = Math.min(product.stock, qty);
        return line;
      })
    );
  },

  clear: function () {
    commit([]);
  }
};

/* ---------- Header badge -------------------------------------------------- */

/** Reflect the cart in every header on the page, visibly and for screen readers. */
function renderCartCount() {
  var count = cart.count();

  var badges = document.querySelectorAll('[data-cart-count]');
  for (var i = 0; i < badges.length; i++) {
    badges[i].textContent = count;
  }

  /* Reads as "Cart, 3 items" — the visible "Cart" text is already part of the
     link's name, so repeating it here would announce it twice. */
  var labels = document.querySelectorAll('[data-cart-count-label]');
  for (var j = 0; j < labels.length; j++) {
    labels[j].textContent = count + (count === 1 ? ' item' : ' items');
  }
}

/* ---------- Toast --------------------------------------------------------- */

var toastEl = null;
var toastTimer = null;

/**
 * Confirm an action to everyone, including screen reader users: the element is
 * a role="status" live region that already exists in the DOM, so setting its
 * text is announced. It deliberately holds no links — a focusable control
 * inside a message that disappears on a timer is a keyboard trap waiting to
 * happen. The header cart link carries the count instead.
 */
function toast(message) {
  if (!toastEl) toastEl = document.querySelector('.toast');
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.add('is-visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.classList.remove('is-visible');
  }, 3000);
}

/* ---------- Wiring -------------------------------------------------------- */

/* Keep the badge honest when another tab changes the cart. */
window.addEventListener('storage', function (event) {
  if (event.key === CART_KEY) renderCartCount();
});

/* This script is loaded at the end of <body>, so the header badge is already
   parsed and can be painted straight away — no flash of "0" while waiting for
   DOMContentLoaded. The listener is a safety net if the tag ever moves into
   <head>; renderCartCount is idempotent, so running it twice is harmless. */
renderCartCount();
document.addEventListener('DOMContentLoaded', renderCartCount);
