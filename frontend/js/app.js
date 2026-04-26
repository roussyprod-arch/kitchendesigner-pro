/* ═════════════════════════════════════════════════════
   APPLICATION PRINCIPALE
═════════════════════════════════════════════════════ */

const API_BASE_URL = 'http://localhost:5000/api';

class KitchenDesignerApp {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('authToken');
    this.cart = JSON.parse(localStorage.getItem('cart')) || [];
    this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    this.init();
  }

  async init() {
    console.log('🏠 Initialisation de KitchenDesigner Pro');
    
    this.setupDOM();
    this.setupEventListeners();
    
    if (this.token) {
      await this.loadUserProfile();
    }
    
    this.renderHome();
  }

  setupDOM() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
      <header>
        <div class="header-container">
          <div class="logo" onclick="window.location.href='/'">
            <div class="logo-icon">🏠</div>
            <span>KitchenDesigner Pro</span>
          </div>
          
          <nav class="nav">
            <ul class="nav-links">
              <li><a href="#" onclick="app.renderHome(); return false;">Accueil</a></li>
              <li><a href="#" onclick="app.renderShop(); return false;">Boutique</a></li>
              <li><a href="#" onclick="app.renderDesigner(); return false;">Concepteur</a></li>
              <li><a href="#" onclick="app.renderAbout(); return false;">À propos</a></li>
            </ul>
          </nav>
          
          <div class="header-actions">
            <button class="btn btn-secondary btn-sm" onclick="app.renderCart()">
              🛒 Panier (<span id="cart-count">0</span>)
            </button>
            <div class="user-menu">
              <div class="user-avatar" onclick="app.toggleUserMenu()">
                ${this.user ? this.user.name.charAt(0) : '👤'}
              </div>
              <div id="user-dropdown" class="hidden" style="
                position: absolute;
                top: 100%;
                right: 0;
                background: var(--bg2);
                border: 1px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
                min-width: 200px;
              ">
                ${this.user ? `
                  <a href="#" onclick="app.renderProfile(); return false;" style="
                    display: block;
                    padding: 0.75rem 1rem;
                    color: var(--text);
                    border-bottom: 1px solid var(--border);
                  ">👤 Mon Profil</a>
                  <a href="#" onclick="app.renderProjects(); return false;" style="
                    display: block;
                    padding: 0.75rem 1rem;
                    color: var(--text);
                    border-bottom: 1px solid var(--border);
                  ">📁 Mes Projets</a>
                  <a href="#" onclick="app.renderOrders(); return false;" style="
                    display: block;
                    padding: 0.75rem 1rem;
                    color: var(--text);
                    border-bottom: 1px solid var(--border);
                  ">📦 Mes Commandes</a>
                  <a href="#" onclick="app.logout(); return false;" style="
                    display: block;
                    padding: 0.75rem 1rem;
                    color: var(--danger);
                  ">🚪 Déconnexion</a>
                ` : `
                  <a href="#" onclick="app.renderLogin(); return false;" style="
                    display: block;
                    padding: 0.75rem 1rem;
                    color: var(--text);
                    border-bottom: 1px solid var(--border);
                  ">Se connecter</a>
                  <a href="#" onclick="app.renderRegister(); return false;" style="
                    display: block;
                    padding: 0.75rem 1rem;
                    color: var(--text);
                  ">S'inscrire</a>
                `}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main id="main-content"></main>
      
      <footer>
        <div class="footer-content">
          <div class="footer-section">
            <h4>À propos</h4>
            <ul>
              <li><a href="#">Qui sommes-nous</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Carrières</a></li>
              <li><a href="#">Presse</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Aide et FAQ</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Retours</a></li>
              <li><a href="#">Garantie</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Légal</h4>
            <ul>
              <li><a href="#">Conditions d'utilisation</a></li>
              <li><a href="#">Politique de confidentialité</a></li>
              <li><a href="#">Cookies</a></li>
              <li><a href="#">Mentions légales</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Nous suivre</h4>
            <ul>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Pinterest</a></li>
              <li><a href="#">YouTube</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 KitchenDesigner Pro. Tous droits réservés.</p>
        </div>
      </footer>
    `;
    
    this.updateCartCount();
  }

  setupEventListeners() {
    // Les event listeners seront configurés dynamiquement
  }

  toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
  }

  async loadUserProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
      } else {
        localStorage.removeItem('authToken');
        this.token = null;
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  }

  renderHome() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="hero">
        <div class="hero-content">
          <h1>Concevez votre cuisine idéale</h1>
          <p>Utilisez notre outil de conception en 3D pour créer la cuisine de vos rêves avec des matériaux de qualité premium</p>
          <div class="hero-buttons">
            <button class="btn btn-primary btn-lg" onclick="app.renderDesigner()">
              ✨ Commencer à concevoir
            </button>
            <button class="btn btn-secondary btn-lg" onclick="app.renderShop()">
              🛍️ Parcourir les produits
            </button>
          </div>
        </div>
      </section>
      
      <section class="container py-4">
        <h2 style="text-align: center; margin-bottom: 3rem;">Produits en vedette</h2>
        <div class="products-grid" id="featured-products">
          <div class="spinner" style="grid-column: 1 / -1; margin: 0 auto;"></div>
        </div>
      </section>
    `;
    
    this.loadFeaturedProducts();
  }

  async loadFeaturedProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/materials?featured=true&limit=6`);
      const data = await response.json();
      this.renderProducts(data.materials);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  }

  renderProducts(products) {
    const container = document.getElementById('featured-products');
    
    if (!products || products.length === 0) {
      container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Aucun produit disponible</p>';
      return;
    }
    
    container.innerHTML = products.map(product => `
      <div class="product-card">
        <div class="product-image" style="background: linear-gradient(135deg, #c9956a 0%, #8b6a47 100%);"></div>
        <div class="product-info">
          <h5 class="product-name">${product.name}</h5>
          <p class="product-category">${product.category}</p>
          <div class="product-rating">
            <span class="stars">${'⭐'.repeat(Math.round(product.rating))}</span>
            <span style="color: var(--muted); font-size: 0.875rem;">(${product.reviews})</span>
          </div>
          <div class="product-price">€${product.price.toFixed(2)}</div>
          <div class="product-actions">
            <button class="btn btn-primary" onclick="app.addToCart('${product._id}', '${product.name}
', ${product.price})">
              Ajouter au panier
            </button>
            <button class="btn btn-secondary" onclick="app.toggleFavorite('${product._id}')">
              ❤️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderShop() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="container py-4">
        <h1 style="margin-bottom: 2rem;">Boutique</h1>
        
        <div style="display: grid; grid-template-columns: 250px 1fr; gap: 2rem; margin-bottom: 2rem;">
          <!-- Filtres -->
          <aside style="background: var(--bg2); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); height: fit-content;">
            <h3 style="margin-bottom: 1rem;">Filtres</h3>
            
            <div class="form-group">
              <label>Catégorie</label>
              <select id="category-filter" onchange="app.applyFilters()">
                <option value="">Toutes</option>
                <option value="cabinets">Armoires</option>
                <option value="countertops">Plans de travail</option>
                <option value="hardware">Quincaillerie</option>
                <option value="appliances">Électroménagers</option>
                <option value="lighting">Éclairage</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Prix (€)</label>
              <input type="range" id="price-filter" min="0" max="5000" step="100" onchange="app.applyFilters()" style="width: 100%;">
              <span id="price-value">0€ - 5000€</span>
            </div>
            
            <div class="form-group">
              <label>Recherche</label>
              <input type="text" id="search-filter" placeholder="Rechercher..." onkeyup="app.applyFilters()" />
            </div>
            
            <button class="btn btn-secondary" style="width: 100%;" onclick="app.resetFilters()">
              Réinitialiser les filtres
            </button>
          </aside>
          
          <!-- Produits -->
          <div>
            <div id="shop-products" class="products-grid">
              <div class="spinner" style="grid-column: 1 / -1;"></div>
            </div>
          </div>
        </div>
      </section>
    `;
    
    this.loadShopProducts();
  }

  async loadShopProducts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      
      const response = await fetch(`${API_BASE_URL}/materials?${params}`);
      const data = await response.json();
      
      const container = document.getElementById('shop-products');
      if (container) {
        this.renderProducts(data.materials);
      }
    } catch (error) {
      console.error('Erreur chargement boutique:', error);
    }
  }

  applyFilters() {
    const category = document.getElementById('category-filter')?.value;
    const maxPrice = document.getElementById('price-filter')?.value;
    const search = document.getElementById('search-filter')?.value;
    
    this.loadShopProducts({ category, maxPrice, search });
  }

  resetFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('price-filter').value = '5000';
    document.getElementById('search-filter').value = '';
    this.loadShopProducts();
  }

  renderDesigner() {
    if (!this.user) {
      alert('Veuillez vous connecter pour accéder au concepteur');
      this.renderLogin();
      return;
    }
    
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="container py-4">
        <h1 style="margin-bottom: 2rem;">Concepteur de Cuisine 3D</h1>
        
        <div style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
          <!-- Viewport 3D -->
          <div id="designer-viewport" style="
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 12px;
            height: 600px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--muted);
          ">
            <p>Visualiseur 3D (intégration Three.js)</p>
          </div>
          
          <!-- Panneau latéral -->
          <div style="background: var(--bg2); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
            <h3 style="margin-bottom: 1rem;">Dimensions</h3>
            
            <div class="form-group">
              <label>Largeur (cm)</label>
              <input type="number" value="150" min="50" max="400">
            </div>
            
            <div class="form-group">
              <label>Profondeur (cm)</label>
              <input type="number" value="60" min="40" max="80">
            </div>
            
            <div class="form-group">
              <label>Hauteur (cm)</label>
              <input type="number" value="200" min="150" max="250">
            </div>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Style</h3>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <label><input type="radio" name="style" value="modern"> Moderne</label>
              <label><input type="radio" name="style" value="classic"> Classique</label>
              <label><input type="radio" name="style" value="rustic"> Rustique</label>
              <label><input type="radio" name="style" value="minimalist"> Minimaliste</label>
            </div>
            
            <button class="btn btn-primary" style="width: 100%; margin-top: 2rem;" onclick="app.saveProject()">
              💾 Sauvegarder le projet
            </button>
          </div>
        </div>
      </section>
    `;
  }

  async saveProject() {
    if (!this.user) {
      alert('Veuillez vous connecter');
      return;
    }
    
    const projectData = {
      name: prompt('Nom du projet:', 'Ma cuisine'),
      description: '',
      width: 150,
      height: 200,
      depth: 60,
      style: document.querySelector('input[name="style"]:checked')?.value || 'modern',
      budget: 10000,
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (response.ok) {
        alert('Projet sauvegardé avec succès!');
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  renderCart() {
    const content = document.getElementById('main-content');
    
    if (this.cart.length === 0) {
      content.innerHTML = `
        <section class="container py-4" style="text-align: center; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <h1 style="margin-bottom: 1rem;">Panier vide</h1>
          <p style="margin-bottom: 2rem;">Votre panier ne contient aucun article</p>
          <button class="btn btn-primary" onclick="app.renderShop()">
            🛍️ Continuer vos achats
          </button>
        </section>
      `;
      return;
    }
    
    let total = 0;
    this.cart.forEach(item => {
      total += item.price * item.quantity;
    });
    
    content.innerHTML = `
      <section class="container py-4">
        <h1 style="margin-bottom: 2rem;">Panier</h1>
        
        <div style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
          <!-- Articles -->
          <div>
            ${this.cart.map((item, index) => `
              <div style="
                background: var(--bg2);
                border: 1px solid var(--border);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
              ">
                <div style="flex: 1;">
                  <h4>${item.name}</h4>
                  <p style="margin-bottom: 0;">€${item.price.toFixed(2)}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <button class="btn btn-sm" onclick="app.updateCartQuantity(${index}, ${item.quantity - 1})">-</button>
                  <span>${item.quantity}</span>
                  <button class="btn btn-sm" onclick="app.updateCartQuantity(${index}, ${item.quantity + 1})">+</button>
                  <button class="btn btn-danger btn-sm" onclick="app.removeFromCart(${index})">
                    🗑️
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Résumé -->
          <div style="
            background: var(--bg2);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            height: fit-content;
          ">
            <h3 style="margin-bottom: 1rem;">Résumé</h3>
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Sous-total</span>
                <span>€${total.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Livraison</span>
                <span>€0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Taxes</span>
                <span>€${(total * 0.2).toFixed(2)}</span>
              </div>
            </div>
            <div style="
              display: flex;
              justify-content: space-between;
              font-size: 1.25rem;
              font-weight: 700;
              margin-bottom: 1.5rem;
            ">
              <span>Total</span>
              <span style="color: var(--accent);">€${(total * 1.2).toFixed(2)}</span>
            </div>
            <button class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;" onclick="app.checkout()">
              💳 Passer la commande
            </button>
            <button class="btn btn-secondary" style="width: 100%;" onclick="app.renderShop()">
              Continuer les achats
            </button>
          </div>
        </div>
      </section>
    `;
  }

  addToCart(productId, productName, price) {
    const existing = this.cart.find(item => item.id === productId);
    
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({
        id: productId,
        name: productName,
        price: price,
        quantity: 1,
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.updateCartCount();
    alert('Article ajouté au panier!');
  }

  removeFromCart(index) {
    this.cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.updateCartCount();
    this.renderCart();
  }

  updateCartQuantity(index, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(index);
    } else {
      this.cart[index].quantity = quantity;
      localStorage.setItem('cart', JSON.stringify(this.cart));
      this.updateCartCount();
      this.renderCart();
    }
  }

  updateCartCount() {
    const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      cartCount.textContent = count;
    }
  }

  toggleFavorite(productId) {
    const index = this.favorites.indexOf(productId);
    if (index > -1) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push(productId);
    }
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
  }

  async checkout() {
    if (!this.user) {
      alert('Veuillez vous connecter pour passer commande');
      this.renderLogin();
      return;
    }
    
    const orderData = {
      items: this.cart,
      billingAddress: {
        street: '123 Rue de la Paix',
        city: 'Paris',
        zipCode: '75000',
        country: 'France',
      },
      shippingAddress: {
        street: '123 Rue de la Paix',
        city: 'Paris',
        zipCode: '75000',
        country: 'France',
      },
      shippingMethod: 'standard',
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.cart = [];
        localStorage.removeItem('cart');
        this.updateCartCount();
        alert('Commande créée avec succès!');
        this.renderHome();
      } else {
        alert('Erreur lors de la création de la commande');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  renderLogin() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="container py-4" style="max-width: 400px; margin: 4rem auto;">
        <h1 style="text-align: center; margin-bottom: 2rem;">Se connecter</h1>
        
        <form onsubmit="app.handleLogin(event)">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" required>
          </div>
          
          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" id="login-password" required>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">
            Se connecter
          </button>
          
          <p style="text-align: center;">
            Pas de compte ? <a href="#" onclick="app.renderRegister(); return false;">S'inscrire</a>
          </p>
        </form>
      </section>
    `;
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', this.token);
        alert('Connexion réussie!');
        this.renderHome();
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  renderRegister() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="container py-4" style="max-width: 400px; margin: 4rem auto;">
        <h1 style="text-align: center; margin-bottom: 2rem;">S'inscrire</h1>
        
        <form onsubmit="app.handleRegister(event)">
          <div class="form-group">
            <label>Nom complet</label>
            <input type="text" id="register-name" required>
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="register-email" required>
          </div>
          
          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" id="register-password" required>
          </div>
          
          <div class="form-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" id="register-confirm" required>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">
            S'inscrire
          </button>
          
          <p style="text-align: center;">
            Vous avez un compte ? <a href="#" onclick="app.renderLogin(); return false;">Se connecter</a>
          </p>
        </form>
      </section>
    `;
  }

  async handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', this.token);
        alert('Inscription réussie!');
        this.renderHome();
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  renderProfile() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="container py-4">
        <h1 style="margin-bottom: 2rem;">Mon Profil</h1>
        
        <div style="max-width: 600px;">
          <div style="background: var(--bg2); padding: 2rem; border-radius: 12px; border: 1px solid var(--border);">
            <div style="text-align: center; margin-bottom: 2rem;">
              <div class="user-avatar" style="width: 80px; height: 80px; margin: 0 auto; margin-bottom: 1rem; font-size: 2rem;">
                ${this.user.name.charAt(0)}
              </div>
              <h2>${this.user.name}</h2>
              <p>${this.user.email}</p>
            </div>
            
            <form onsubmit="app.handleUpdateProfile(event)">
              <div class="form-group">
                <label>Nom complet</label>
                <input type="text" value="${this.user.name}" id="profile-name">
              </div>
              
              <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" value="${this.user.phone || ''}">
              </div>
              
              <div class="form-group">
                <label>Langue</label>
                <select>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              
              <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  async handleUpdateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profile-name').value;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (response.ok) {
        alert('Profil mis à jour!');
        await this.loadUserProfile();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  renderProjects() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="container py-4">
        <h1 style="margin-bottom: 2rem;">Mes Projets</h1>
        
        <button class="btn btn-primary" style="margin-bottom: 2rem;" onclick="app.renderDesigner()">
          ➕ Nouveau Projet
        </button>
        
        <div id="projects-list">
          <div class="spinner"></div>
        </div>
      </section>
    `;
    
    this.loadUserProjects();
  }

  async loadUserProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      const data = await response.json();
      const container = document.getElementById('projects-list');
      
      if (data.projects.length === 0) {
        container.innerHTML = '<p>Vous n\'avez aucun projet pour le moment</p>';
        return;
      }
      
      container.innerHTML = data.projects.map(project => `
        <div style="
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <h4>${project.name}</h4>
            <p>${project.description || 'Sans description'}</p>
            <small style="color: var(--muted);">Créé le: ${new Date(project.createdAt).toLocaleDateString('fr-FR')}</small>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button class="btn btn-primary" onclick="app.renderDesigner()">
              ✏️ Modifier
            </button>
            <button class="btn btn-danger">
              🗑️ Supprimer
            </button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  renderOrders() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="container py-4">
        <h1 style="margin-bottom: 2rem;">Mes Commandes</h1>
        
        <div id="orders-list">
          <div class="spinner"></div>
        </div>
      </section>
    `;
    
    this.loadUserOrders();
  }

  async loadUserOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      const data = await response.json();
      const container = document.getElementById('orders-list');
      
      if (data.orders.length === 0) {
        container.innerHTML = '<p>Vous n\'avez aucune commande pour le moment</p>';
        return;
      }
      
      container.innerHTML = data.orders.map(order => `
        <div style="
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        ">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <h4>Commande #${order._id.slice(-8)}</h4>
            <span style="
              background: var(--info);
              color: white;
              padding: 0.25rem 0.75rem;
              border-radius: 20px;
              font-size: 0.875rem;
            ">${order.status}</span>
          </div>
          <p>Total: <strong style="color: var(--accent);">€${order.totalAmount.toFixed(2)}</strong></p>
          <small style="color: var(--muted);">Commandé le: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</small>
        </div>
      `).join('');
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  renderAbout() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <section class="container py-4">
        <h1 style="margin-bottom: 2rem; text-align: center;">À propos de nous</h1>
        
        <div style="max-width: 800px; margin: 0 auto;">
          <p style="font-size: 1.125rem; line-height: 1.8;">
            KitchenDesigner Pro est la plateforme leader de conception de cuisines en ligne.
            Avec nos outils 3D innovants et notre large sélection de matériaux premium,
            nous vous aidons à créer la cuisine de vos rêves.
          </p>
          
          <h2 style="margin-top: 2rem;">Nos Valeurs</h2>
          <ul style="list-style: none; margin-top: 1rem;">
            <li style="padding: 1rem; background: var(--bg2); border-left: 4px solid var(--accent); margin-bottom: 1rem;">
              ✨ <strong>Qualité</strong> - Nous n'utilisons que les meilleurs matériaux
            </li>
            <li style="padding: 1rem; background: var(--bg2); border-left: 4px solid var(--accent); margin-bottom: 1rem;">
              🎨 <strong>Innovation</strong> - Outils de conception dernier cri
            </li>
            <li style="padding: 1rem; background: var(--bg2); border-left: 4px solid var(--accent); margin-bottom: 1rem;">
              💬 <strong>Support</strong> - Équipe dédiée à votre service
            </li>
          </ul>
        </div>
      </section>
    `;
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('authToken');
    this.renderHome();
    location.reload();
  }
}

// Initialiser l'application
const app = new KitchenDesignerApp();
