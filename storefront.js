(() => {
  const STORAGE_KEY = '1thinggreen-preview-cart';
  const drawer = document.querySelector('[data-cart-drawer]');
  const backdrop = document.querySelector('[data-cart-backdrop]');
  const itemsRoot = document.querySelector('[data-cart-items]');
  const totalRoot = document.querySelector('[data-cart-total]');
  const countRoots = document.querySelectorAll('[data-cart-count]');
  const cartOpeners = document.querySelectorAll('[data-cart-open]');
  const menuButton = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  let lastFocused = null;

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const readCart = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(saved)) return [];
      return saved.filter((item) => item && item.title && Number(item.price) >= 0 && Number(item.quantity) > 0);
    } catch {
      return [];
    }
  };

  let cart = readCart();

  const saveCart = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCart();
  };

  const renderCart = () => {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    countRoots.forEach((root) => { root.textContent = itemCount; });
    if (totalRoot) totalRoot.textContent = money.format(total);
    if (!itemsRoot) return;

    if (!cart.length) {
      itemsRoot.innerHTML = '<div class="cart-empty"><div><h3>Your cart is empty</h3><p>Add a bundle and it will appear here.</p></div></div>';
      return;
    }

    itemsRoot.innerHTML = cart.map((item, index) => `
      <article class="cart-item">
        <div>
          <div class="cart-item__title">${escapeHtml(item.title)}</div>
          <div class="cart-item__price">${money.format(item.price)} each</div>
          <div class="cart-item__controls" aria-label="Quantity controls for ${escapeHtml(item.title)}">
            <button type="button" data-cart-action="decrease" data-cart-index="${index}" aria-label="Decrease quantity">−</button>
            <strong>${item.quantity}</strong>
            <button type="button" data-cart-action="increase" data-cart-index="${index}" aria-label="Increase quantity">+</button>
            <button class="cart-item__remove" type="button" data-cart-action="remove" data-cart-index="${index}">Remove</button>
          </div>
        </div>
        <strong>${money.format(item.price * item.quantity)}</strong>
      </article>
    `).join('');
  };

  const openCart = () => {
    if (!drawer || !backdrop) return;
    lastFocused = document.activeElement;
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    cartOpeners.forEach((opener) => opener.setAttribute('aria-expanded', 'true'));
    document.body.classList.add('cart-is-open');
    drawer.querySelector('[data-cart-close]')?.focus();
  };

  const closeCart = () => {
    if (!drawer || !backdrop) return;
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    cartOpeners.forEach((opener) => opener.setAttribute('aria-expanded', 'false'));
    document.body.classList.remove('cart-is-open');
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  document.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add-to-cart]');
    if (addButton) {
      const title = addButton.dataset.title;
      const price = Number(addButton.dataset.price);
      const existing = cart.find((item) => item.title === title);
      if (existing) existing.quantity += 1;
      else cart.push({ title, price, quantity: 1 });
      saveCart();
      openCart();
      return;
    }

    if (event.target.closest('[data-cart-open]')) openCart();
    if (event.target.closest('[data-cart-close]') || event.target.closest('[data-cart-backdrop]')) closeCart();

    const actionButton = event.target.closest('[data-cart-action]');
    if (actionButton) {
      const index = Number(actionButton.dataset.cartIndex);
      const action = actionButton.dataset.cartAction;
      if (!cart[index]) return;
      if (action === 'increase') cart[index].quantity += 1;
      if (action === 'decrease') cart[index].quantity -= 1;
      if (action === 'remove' || cart[index].quantity <= 0) cart.splice(index, 1);
      saveCart();
    }

    const mobileLink = event.target.closest('.mobile-nav a');
    if (mobileLink && menuButton && mobileNav) {
      mobileNav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    }
  });

  menuButton?.addEventListener('click', () => {
    const open = mobileNav?.classList.toggle('is-open') ?? false;
    menuButton.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCart();
  });

  renderCart();
})();
