// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.background = 'rgba(255, 250, 230, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(183, 149, 11, 0.15)';
    } else {
        header.style.background = 'rgba(255, 250, 230, 0.95)';
        header.style.boxShadow = '0 2px 10px rgba(183, 149, 11, 0.1)';
    }
});

// Глобальные переменные
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Modal functionality
const modal = document.getElementById("contacts-modal");
const btn = document.getElementById("contacts-link");
const spans = document.getElementsByClassName("close");

btn.onclick = function(event) {
    event.preventDefault();
    modal.style.display = "block";
    document.body.style.overflow = 'hidden';
}

// Закрытие модальных окон
Array.from(spans).forEach(span => {
    span.onclick = function() {
        modal.style.display = "none";
        document.body.style.overflow = '';
    }
});

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.style.overflow = '';
    }
}

// Tab navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const productGrids = document.querySelectorAll('.products-grid');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and grids
            tabBtns.forEach(b => b.classList.remove('active'));
            productGrids.forEach(grid => grid.classList.remove('active'));
            
            // Add active class to clicked button and corresponding grid
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Smooth scroll to products section
            document.getElementById('categories').scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Инициализация избранного и корзины
    initFavorites();
    initCart();
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Функционал избранного
function initFavorites() {
    updateFavoritesCount();
    updateFavoritesDropdown();
    addFavoriteButtons();
}

function initCart() {
    updateCartCount();
    updateCartDropdown();
}

function addFavoriteButtons() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent;
        const productPrice = card.querySelector('.price').textContent;
        const productImage = card.querySelector('img')?.src || '';
        
        // Проверяем, есть ли уже кнопка
        if (!card.querySelector('.favorite-btn')) {
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn';
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
            
            // Проверяем, есть ли товар в избранном
            if (isInFavorites(productName)) {
                favoriteBtn.classList.add('active');
                favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
            }
            
            favoriteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleFavorite(productName, productPrice, productImage, favoriteBtn);
            });
            
            card.appendChild(favoriteBtn);
        }
    });
}

function toggleFavorite(name, price, image, button) {
    const product = { name, price, image };
    const index = favorites.findIndex(item => item.name === name);
    
    if (index === -1) {
        // Добавляем в избранное
        favorites.push(product);
        button.classList.add('active');
        button.innerHTML = '<i class="fas fa-heart"></i>';
        showNotification('Товар добавлен в избранное!', 'success');
    } else {
        // Удаляем из избранного
        favorites.splice(index, 1);
        button.classList.remove('active');
        button.innerHTML = '<i class="far fa-heart"></i>';
        showNotification('Товар удален из избранного', 'info');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesCount();
    updateFavoritesDropdown();
}

function isInFavorites(productName) {
    return favorites.some(item => item.name === productName);
}

function updateFavoritesCount() {
    const countElement = document.querySelector('.favorites-count');
    countElement.textContent = favorites.length;
}

function updateFavoritesDropdown() {
    const favoritesList = document.getElementById('favorites-dropdown-list');
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-dropdown">
                <i class="fas fa-heart"></i>
                <p>В избранном пока пусто</p>
            </div>
        `;
    } else {
        favoritesList.innerHTML = favorites.map((item, index) => `
            <div class="dropdown-item">
                <img src="${item.image || 'псмир.jpg'}" alt="${item.name}" onerror="this.src='псмир.jpg'">
                <div class="dropdown-item-info">
                    <div class="dropdown-item-name">${item.name}</div>
                    <div class="dropdown-item-price">${item.price}</div>
                </div>
                <button class="remove-item" onclick="removeFromFavorites(${index})" title="Удалить из избранного">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
}

function removeFromFavorites(index) {
    if (index >= 0 && index < favorites.length) {
        const removedItem = favorites[index];
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesCount();
        updateFavoritesDropdown();
        
        // Обновляем кнопки на карточках товаров
        const favoriteBtns = document.querySelectorAll('.favorite-btn');
        favoriteBtns.forEach(btn => {
            const card = btn.closest('.product-card');
            const name = card.querySelector('h3').textContent;
            if (name === removedItem.name) {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-heart"></i>';
            }
        });
        
        showNotification('Товар удален из избранного', 'info');
    }
}

// Функционал корзины
function addToCart(productName, productPrice, productImage) {
    const existingProduct = cart.find(item => item.name === productName);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        const product = { 
            name: productName, 
            price: productPrice, 
            image: productImage,
            quantity: 1
        };
        cart.push(product);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDropdown();
    showNotification('Товар добавлен в корзину!', 'success');
}

function updateCartCount() {
    const countElement = document.querySelector('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    countElement.textContent = totalItems;
}

function updateCartDropdown() {
    const cartList = document.getElementById('cart-dropdown-list');
    const totalAmount = document.getElementById('dropdown-total-amount');
    
    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="empty-dropdown">
                <i class="fas fa-shopping-cart"></i>
                <p>Корзина пуста</p>
            </div>
        `;
        totalAmount.textContent = '0 ₽';
    } else {
        let total = 0;
        cartList.innerHTML = '';
        
        cart.forEach((item, index) => {
            const price = parseInt(item.price.replace(/\s/g, '').replace('₽', '')) || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'dropdown-item';
            itemElement.innerHTML = `
                <img src="${item.image || 'псмир.jpg'}" alt="${item.name}" onerror="this.src='псмир.jpg'">
                <div class="dropdown-item-info">
                    <div class="dropdown-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseQuantity(${index})" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="increaseQuantity(${index})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="cart-item-total">${itemTotal} ₽</div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${index})" title="Удалить из корзины">
                    <i class="fas fa-times"></i>
                </button>
            `;
            cartList.appendChild(itemElement);
        });
        
        totalAmount.textContent = `${total} ₽`;
    }
}

function increaseQuantity(index) {
    if (index >= 0 && index < cart.length) {
        cart[index].quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartDropdown();
    }
}

function decreaseQuantity(index) {
    if (index >= 0 && index < cart.length) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            updateCartDropdown();
        } else {
            removeFromCart(index);
        }
    }
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartDropdown();
        showNotification('Товар удален из корзины', 'info');
    }
}

// Обработчики для кнопок "В корзину"
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-buy')) {
        const card = e.target.closest('.product-card');
        const productName = card.querySelector('h3').textContent;
        const productPrice = card.querySelector('.price').textContent;
        const productImage = card.querySelector('img')?.src || '';
        
        addToCart(productName, productPrice, productImage);
    }
});

// Очистка избранного
document.getElementById('clear-favorites-dropdown')?.addEventListener('click', function() {
    if (favorites.length > 0) {
        if (confirm('Вы уверены, что хотите очистить избранное?')) {
            favorites = [];
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateFavoritesCount();
            updateFavoritesDropdown();
            
            // Сбрасываем все кнопки избранного
            const favoriteBtns = document.querySelectorAll('.favorite-btn');
            favoriteBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-heart"></i>';
            });
            
            showNotification('Избранное очищено', 'info');
        }
    }
});

// Очистка корзины
document.getElementById('clear-cart-dropdown')?.addEventListener('click', function() {
    if (cart.length > 0) {
        if (confirm('Вы уверены, что хотите очистить корзину?')) {
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            updateCartDropdown();
            showNotification('Корзина очищена', 'info');
        }
    }
});

// Оформление заказа - ИЗМЕНЕНО: переход в Telegram вместо WhatsApp
document.getElementById('checkout-dropdown')?.addEventListener('click', function() {
    if (cart.length > 0) {
        const total = cart.reduce((sum, item) => {
            const price = parseInt(item.price.replace(/\s/g, '').replace('₽', '')) || 0;
            return sum + (price * item.quantity);
        }, 0);
        
        const orderDetails = cart.map(item => 
            `${item.name} - ${item.quantity}шт. - ${(parseInt(item.price.replace(/\s/g, '').replace('₽', '')) || 0) * item.quantity}₽`
        ).join('\n');
        
        const message = `🛒 Здравствуйте! Можно ли заказать у вас следующее: \n\n${orderDetails}\n\n💰 ИТОГО: ${total}₽\n\n📞 Для подтверждения заказа свяжитесь с нами!`;
        const telegramUsername = 'E404_Offline'; // Замените на актуальный username Telegram
        
        // Открываем Telegram с сообщением
        window.open(`https://t.me/${telegramUsername}?text=${encodeURIComponent(message)}`, '_blank');
        
        // Очищаем корзину после оформления
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        updateCartDropdown();
    } else {
        showNotification('Корзина пуста', 'error');
    }
});

// Просмотр всех избранных
document.getElementById('view-all-favorites')?.addEventListener('click', function() {
    if (favorites.length > 0) {
        showNotification('Показаны все избранные товары', 'success');
        // Здесь можно добавить логику показа всех избранных
    } else {
        showNotification('В избранном пока нет товаров', 'error');
    }
});

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type === 'error' ? 'error' : ''}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Animation for cards on scroll
function animateOnScroll() {
    const cards = document.querySelectorAll('.category-card, .product-card');
    cards.forEach(card => {
        const cardPosition = card.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        if (cardPosition < screenPosition) {
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }
    });
}

// Initialize animations
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.category-card, .product-card');
    cards.forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
});