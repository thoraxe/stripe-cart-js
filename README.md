# stripe-cart-js

A lightweight, framework-free shopping cart library for Stripe Checkout.

## Features

- 📦 **Zero dependencies** - Pure vanilla JavaScript
- 💾 **Persistent storage** - Cart saved to localStorage
- 🎨 **Customizable UI** - Default sliding sidebar included
- 🔌 **Backend agnostic** - Works with any Stripe Checkout implementation
- 🪶 **Lightweight** - ~5kb minified
- 🎯 **Simple API** - Easy to integrate

## Quick Start

### 1. Include the library

```html
<script src="lib/stripe-cart-js/stripe-cart.js"></script>
<script src="lib/stripe-cart-js/stripe-cart-ui.js"></script>
```

### 2. Add cart sidebar HTML

```html
<div id="cart-sidebar">
  <div class="cart-overlay"></div>
  <div class="cart-panel">
    <div class="cart-header">
      <h3>Shopping Cart</h3>
      <button class="cart-close" data-cart-close>×</button>
    </div>
    <div class="cart-body">
      <div class="cart-empty" style="display: none;">
        <p>Your cart is empty</p>
      </div>
      <div class="cart-content">
        <div class="cart-items"></div>
      </div>
    </div>
    <div class="cart-footer">
      <div class="cart-total">
        <span class="cart-total-label">Subtotal:</span>
        <span class="cart-total-amount">$0.00</span>
      </div>
      <div class="cart-actions">
        <button class="cart-checkout-btn" data-cart-checkout>Checkout</button>
        <button class="cart-continue-btn" data-cart-close>Continue Shopping</button>
      </div>
    </div>
  </div>
</div>

<!-- Cart toggle button (in your nav) -->
<a href="#" data-cart-toggle>
  <i class="icon fa-shopping-cart"></i>
  <span id="cart-badge" class="cart-badge">0</span>
</a>
```

### 3. Initialize

```javascript
// Initialize cart
const cart = new StripeCart({
  checkoutEndpoint: '/.netlify/functions/create-checkout-session',
  currency: 'usd'
});

// Initialize UI
const cartUI = new StripeCartUI(cart);

// Add items
cart.add({
  priceId: 'price_1ABC123',
  name: 'Cool Product',
  price: 29.99,
  image: '/path/to/image.jpg',
  quantity: 1
});
```

## API Reference

### StripeCart(options)

Creates a new cart instance.

**Options:**
- `storageKey` (string) - localStorage key, default: 'stripe_cart'
- `currency` (string) - Currency code, default: 'usd'
- `checkoutEndpoint` (string) - Your checkout endpoint URL
- `onUpdate` (function) - Callback fired when cart updates
- `onCheckout` (function) - Callback fired before checkout
- `onError` (function) - Callback fired on errors

**Methods:**
- `add(item)` - Add item to cart
- `remove(priceId)` - Remove item by Stripe Price ID
- `update(priceId, quantity)` - Update item quantity
- `clear()` - Clear entire cart
- `getItems()` - Get all items
- `getCount()` - Get total item count
- `getTotal()` - Get cart total
- `checkout()` - Initiate Stripe Checkout

### StripeCartUI(cart, options)

Creates cart UI component.

**Options:**
- `sidebarSelector` (string) - Cart sidebar selector, default: '#cart-sidebar'
- `badgeSelector` (string) - Badge selector, default: '#cart-badge'
- `toggleSelector` (string) - Toggle selector, default: '[data-cart-toggle]'
- `currency` (string) - Currency code, default: 'usd'
- `currencySymbol` (string) - Currency symbol, default: '$'

**Methods:**
- `open()` - Open cart sidebar
- `close()` - Close cart sidebar
- `render()` - Re-render cart items
- `updateBadge()` - Update cart badge count

## Backend Setup

Your checkout endpoint should accept a POST request with this format:

```json
{
  "items": [
    { "priceId": "price_1ABC123", "quantity": 2 },
    { "priceId": "price_1DEF456", "quantity": 1 }
  ]
}
```

And return:

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_..."
}
```

### Example (Netlify Function)

See `netlify/functions/create-checkout-session.js` for a complete example.

## Events

The library dispatches custom events you can listen to:

```javascript
window.addEventListener('stripe-cart:update', (e) => {
  console.log('Cart updated:', e.detail);
  // { items, total, count }
});

window.addEventListener('stripe-cart:error', (e) => {
  console.error('Cart error:', e.detail.error);
});
```

## Styling

The library includes minimal structural CSS. You can customize by overriding these classes:

- `.cart-sidebar` - Main sidebar container
- `.cart-panel` - Sliding panel
- `.cart-item` - Individual cart item
- `.cart-badge` - Item count badge
- See source for full list

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Modern browsers with ES6 support

## License

MIT License - see LICENSE file

## Contributing

Pull requests welcome! Please ensure code follows existing style.

## Support

Created for [EJdB Music](https://ejdbmusic.com)

Found a bug? [Open an issue](https://github.com/yourusername/stripe-cart-js/issues)
