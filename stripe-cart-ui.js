/**
 * stripe-cart-ui.js v1.0.0
 * Default UI for stripe-cart-js (sliding sidebar)
 * Requires: stripe-cart.js
 *
 * @license MIT
 */

(function(window) {
	'use strict';

	/**
	 * StripeCartUI - Manages cart sidebar UI
	 * @param {StripeCart} cart - StripeCart instance
	 * @param {Object} options - UI configuration
	 */
	function StripeCartUI(cart, options) {
		if (!cart || !(cart instanceof window.StripeCart)) {
			throw new Error('StripeCartUI requires a StripeCart instance');
		}

		this.cart = cart;
		this.config = Object.assign({
			sidebarSelector: '#cart-sidebar',
			badgeSelector: '#cart-badge',
			toggleSelector: '[data-cart-toggle]',
			currency: 'usd',
			currencySymbol: '$',
			emptyMessage: 'Your cart is empty'
		}, options || {});

		this.sidebar = null;
		this.badge = null;

		// Initialize UI
		this.init();
	}

	/**
	 * Initialize UI
	 */
	StripeCartUI.prototype.init = function() {
		this.sidebar = document.querySelector(this.config.sidebarSelector);
		this.badge = document.querySelector(this.config.badgeSelector);

		if (!this.sidebar) {
			console.warn('Cart sidebar element not found:', this.config.sidebarSelector);
			return;
		}

		// Bind event listeners
		this.bindEvents();

		// Initial render
		this.render();
		this.updateBadge();

		// Listen for cart updates
		window.addEventListener('stripe-cart:update', () => {
			this.render();
			this.updateBadge();
		});
	};

	/**
	 * Bind UI event listeners
	 */
	StripeCartUI.prototype.bindEvents = function() {
		const self = this;

		// Toggle sidebar
		document.addEventListener('click', function(e) {
			// Open cart
			if (e.target.matches(self.config.toggleSelector) ||
			    e.target.closest(self.config.toggleSelector)) {
				e.preventDefault();
				self.open();
			}

			// Close cart
			if (e.target.matches('[data-cart-close]') ||
			    e.target.closest('[data-cart-close]')) {
				e.preventDefault();
				self.close();
			}

			// Checkout
			if (e.target.matches('[data-cart-checkout]') ||
			    e.target.closest('[data-cart-checkout]')) {
				e.preventDefault();
				self.cart.checkout();
			}

			// Remove item
			if (e.target.matches('[data-cart-remove]') ||
			    e.target.closest('[data-cart-remove]')) {
				e.preventDefault();
				const priceId = (e.target.closest('[data-cart-remove]') || e.target).dataset.cartRemove;
				self.cart.remove(priceId);
			}

			// Increase quantity
			if (e.target.matches('[data-cart-increase]') ||
			    e.target.closest('[data-cart-increase]')) {
				e.preventDefault();
				const priceId = (e.target.closest('[data-cart-increase]') || e.target).dataset.cartIncrease;
				const item = self.cart.getItems().find(i => i.priceId === priceId);
				if (item) {
					self.cart.update(priceId, item.quantity + 1);
				}
			}

			// Decrease quantity
			if (e.target.matches('[data-cart-decrease]') ||
			    e.target.closest('[data-cart-decrease]')) {
				e.preventDefault();
				const priceId = (e.target.closest('[data-cart-decrease]') || e.target).dataset.cartDecrease;
				const item = self.cart.getItems().find(i => i.priceId === priceId);
				if (item) {
					self.cart.update(priceId, item.quantity - 1);
				}
			}
		});

		// Close on overlay click
		if (this.sidebar) {
			const overlay = this.sidebar.querySelector('.cart-overlay');
			if (overlay) {
				overlay.addEventListener('click', function() {
					self.close();
				});
			}
		}
	};

	/**
	 * Open cart sidebar
	 */
	StripeCartUI.prototype.open = function() {
		if (this.sidebar) {
			this.sidebar.classList.add('cart-open');
			document.body.style.overflow = 'hidden';
		}
	};

	/**
	 * Close cart sidebar
	 */
	StripeCartUI.prototype.close = function() {
		if (this.sidebar) {
			this.sidebar.classList.remove('cart-open');
			document.body.style.overflow = '';
		}
	};

	/**
	 * Render cart items
	 */
	StripeCartUI.prototype.render = function() {
		if (!this.sidebar) return;

		const items = this.cart.getItems();
		const cartItems = this.sidebar.querySelector('.cart-items');
		const cartTotal = this.sidebar.querySelector('.cart-total-amount');
		const emptyState = this.sidebar.querySelector('.cart-empty');
		const cartContent = this.sidebar.querySelector('.cart-content');

		if (!cartItems) return;

		// Show/hide empty state
		if (items.length === 0) {
			if (emptyState) emptyState.style.display = 'block';
			if (cartContent) cartContent.style.display = 'none';
			return;
		} else {
			if (emptyState) emptyState.style.display = 'none';
			if (cartContent) cartContent.style.display = 'block';
		}

		// Render items
		cartItems.innerHTML = items.map(item => this.renderItem(item)).join('');

		// Update total
		if (cartTotal) {
			cartTotal.textContent = this.formatPrice(this.cart.getTotal());
		}
	};

	/**
	 * Render single cart item
	 * @param {Object} item - Cart item
	 * @returns {string} HTML string
	 */
	StripeCartUI.prototype.renderItem = function(item) {
		const imageHtml = item.image
			? `<img src="${item.image}" alt="${item.name}" class="cart-item-image">`
			: '<div class="cart-item-image-placeholder"></div>';

		return `
			<div class="cart-item" data-price-id="${item.priceId}">
				<div class="cart-item-image-container">
					${imageHtml}
				</div>
				<div class="cart-item-details">
					<h4 class="cart-item-name">${item.name}</h4>
					<div class="cart-item-price">${this.formatPrice(item.price)}</div>
					<div class="cart-item-quantity">
						<button class="cart-qty-btn" data-cart-decrease="${item.priceId}" aria-label="Decrease quantity">
							<span>−</span>
						</button>
						<span class="cart-qty-value">${item.quantity}</span>
						<button class="cart-qty-btn" data-cart-increase="${item.priceId}" aria-label="Increase quantity">
							<span>+</span>
						</button>
					</div>
				</div>
				<button class="cart-item-remove" data-cart-remove="${item.priceId}" aria-label="Remove item">
					<span>×</span>
				</button>
			</div>
		`;
	};

	/**
	 * Update cart badge
	 */
	StripeCartUI.prototype.updateBadge = function() {
		if (!this.badge) return;

		const count = this.cart.getCount();

		if (count > 0) {
			this.badge.textContent = count;
			this.badge.style.display = 'inline-block';
		} else {
			this.badge.style.display = 'none';
		}
	};

	/**
	 * Format price
	 * @param {number} price - Price to format
	 * @returns {string} Formatted price
	 */
	StripeCartUI.prototype.formatPrice = function(price) {
		return this.config.currencySymbol + price.toFixed(2);
	};

	// Export to window
	window.StripeCartUI = StripeCartUI;

})(window);
