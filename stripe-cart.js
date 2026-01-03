/**
 * stripe-cart-js v1.0.0
 * A lightweight, framework-free shopping cart for Stripe Checkout
 * https://github.com/yourusername/stripe-cart-js
 *
 * @license MIT
 */

(function(window) {
	'use strict';

	/**
	 * StripeCart - Main cart class
	 * @param {Object} options - Configuration options
	 */
	function StripeCart(options) {
		// Default configuration
		this.config = Object.assign({
			storageKey: 'stripe_cart',
			currency: 'usd',
			checkoutEndpoint: '/.netlify/functions/create-checkout-session',
			onUpdate: null,
			onCheckout: null,
			onError: null
		}, options || {});

		// Initialize cart from localStorage
		this.items = this.loadFromStorage();

		// Bind methods to instance
		this.add = this.add.bind(this);
		this.remove = this.remove.bind(this);
		this.update = this.update.bind(this);
		this.clear = this.clear.bind(this);
		this.checkout = this.checkout.bind(this);
	}

	/**
	 * Add item to cart
	 * @param {Object} item - Item object {priceId, name, price, image, quantity}
	 */
	StripeCart.prototype.add = function(item) {
		if (!item.priceId || !item.name || item.price === undefined) {
			this.handleError(new Error('Item must have priceId, name, and price'));
			return;
		}

		// Check if item already exists
		const existingIndex = this.items.findIndex(i => i.priceId === item.priceId);

		if (existingIndex > -1) {
			// Update quantity if item exists
			this.items[existingIndex].quantity += (item.quantity || 1);
		} else {
			// Add new item
			this.items.push({
				priceId: item.priceId,
				name: item.name,
				price: parseFloat(item.price),
				image: item.image || null,
				quantity: item.quantity || 1
			});
		}

		this.saveToStorage();
		this.triggerUpdate();
	};

	/**
	 * Remove item from cart
	 * @param {string} priceId - Stripe Price ID
	 */
	StripeCart.prototype.remove = function(priceId) {
		this.items = this.items.filter(item => item.priceId !== priceId);
		this.saveToStorage();
		this.triggerUpdate();
	};

	/**
	 * Update item quantity
	 * @param {string} priceId - Stripe Price ID
	 * @param {number} quantity - New quantity
	 */
	StripeCart.prototype.update = function(priceId, quantity) {
		const item = this.items.find(i => i.priceId === priceId);

		if (item) {
			if (quantity <= 0) {
				this.remove(priceId);
			} else {
				item.quantity = parseInt(quantity, 10);
				this.saveToStorage();
				this.triggerUpdate();
			}
		}
	};

	/**
	 * Clear all items from cart
	 */
	StripeCart.prototype.clear = function() {
		this.items = [];
		this.saveToStorage();
		this.triggerUpdate();
	};

	/**
	 * Get all items in cart
	 * @returns {Array} Cart items
	 */
	StripeCart.prototype.getItems = function() {
		return this.items;
	};

	/**
	 * Get total number of items
	 * @returns {number} Total item count
	 */
	StripeCart.prototype.getCount = function() {
		return this.items.reduce((total, item) => total + item.quantity, 0);
	};

	/**
	 * Get cart total price
	 * @returns {number} Total price
	 */
	StripeCart.prototype.getTotal = function() {
		return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
	};

	/**
	 * Checkout - Send cart to Stripe
	 * @returns {Promise}
	 */
	StripeCart.prototype.checkout = async function() {
		if (this.items.length === 0) {
			this.handleError(new Error('Cart is empty'));
			return;
		}

		try {
			// Trigger checkout callback
			if (typeof this.config.onCheckout === 'function') {
				this.config.onCheckout(this.items);
			}

			// Call checkout endpoint
			const response = await fetch(this.config.checkoutEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					items: this.items.map(item => ({
						priceId: item.priceId,
						quantity: item.quantity
					}))
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Checkout failed');
			}

			// Redirect to Stripe checkout
			if (data.url) {
				window.location.href = data.url;
			} else {
				throw new Error('No checkout URL returned');
			}

		} catch (error) {
			this.handleError(error);
		}
	};

	/**
	 * Save cart to localStorage
	 */
	StripeCart.prototype.saveToStorage = function() {
		try {
			localStorage.setItem(this.config.storageKey, JSON.stringify(this.items));
		} catch (e) {
			console.warn('Could not save cart to localStorage:', e);
		}
	};

	/**
	 * Load cart from localStorage
	 * @returns {Array} Cart items
	 */
	StripeCart.prototype.loadFromStorage = function() {
		try {
			const stored = localStorage.getItem(this.config.storageKey);
			return stored ? JSON.parse(stored) : [];
		} catch (e) {
			console.warn('Could not load cart from localStorage:', e);
			return [];
		}
	};

	/**
	 * Trigger update callback
	 */
	StripeCart.prototype.triggerUpdate = function() {
		if (typeof this.config.onUpdate === 'function') {
			this.config.onUpdate(this.items, this.getTotal(), this.getCount());
		}

		// Dispatch custom event
		window.dispatchEvent(new CustomEvent('stripe-cart:update', {
			detail: {
				items: this.items,
				total: this.getTotal(),
				count: this.getCount()
			}
		}));
	};

	/**
	 * Handle errors
	 * @param {Error} error
	 */
	StripeCart.prototype.handleError = function(error) {
		console.error('StripeCart Error:', error);

		if (typeof this.config.onError === 'function') {
			this.config.onError(error);
		}

		// Dispatch custom event
		window.dispatchEvent(new CustomEvent('stripe-cart:error', {
			detail: { error: error }
		}));
	};

	// Export to window
	window.StripeCart = StripeCart;

})(window);
