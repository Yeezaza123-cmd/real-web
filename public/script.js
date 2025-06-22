// ตัวแปรสำหรับเก็บข้อมูล
let products = [];
let cart = [];

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const totalPriceElement = document.getElementById('totalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');

// Input validation functions
function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

function sanitizeInput(input) {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Hamburger menu toggle
const hamburgerBtn = document.getElementById('hamburgerBtn');
const hamburgerMenu = document.getElementById('hamburgerMenu');
if (hamburgerBtn && hamburgerMenu) {
    hamburgerBtn.addEventListener('click', function() {
        hamburgerBtn.classList.toggle('active');
        hamburgerMenu.classList.toggle('show');
    });
    document.addEventListener('click', function(e) {
        if (!hamburgerBtn.contains(e.target) && !hamburgerMenu.contains(e.target)) {
            hamburgerBtn.classList.remove('active');
            hamburgerMenu.classList.remove('show');
        }
    });
}

// โหลดข้อมูลสินค้า
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        // ใช้ข้อมูล fallback ถ้า API ไม่ทำงาน
        products = [
            {
                id: 1,
                name: 'เสื้อสีดำ',
                color: 'black',
                price: 229,
                image: '/images/black.png',
                sizes: ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
            },
            {
                id: 2,
                name: 'เสื้อสีน้ำตาล',
                color: 'brown',
                price: 229,
                image: '/images/brown.png',
                sizes: ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
            },
            {
                id: 3,
                name: 'เสื้อสีขาว',
                color: 'white',
                price: 229,
                image: '/images/white.png',
                sizes: ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
            }
        ];
        displayProducts();
    }
}

// แสดงสินค้า
function displayProducts() {
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onload="this.style.display='block'" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'product-image-placeholder\\'><strong>${product.name}</strong><br>ไม่มีรูปภาพ</div>'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${product.price} บาท</p>
                <div class="product-controls">
                    <select class="size-select" data-product-id="${product.id}">
                        <option value="">เลือกไซส์</option>
                        ${product.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                    </select>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="changeQuantity(${product.id}, -1)">-</button>
                        <span class="quantity-display" id="quantity-${product.id}">1</span>
                        <button class="quantity-btn" onclick="changeQuantity(${product.id}, 1)">+</button>
                    </div>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">เพิ่มลงตะกร้า</button>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
    });
}

// เปลี่ยนจำนวนสินค้า
function changeQuantity(productId, change) {
    const quantityElement = document.getElementById(`quantity-${productId}`);
    let currentQuantity = parseInt(quantityElement.textContent);
    let newQuantity = currentQuantity + change;
    
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 10) newQuantity = 10; // จำกัดจำนวนสูงสุด
    
    quantityElement.textContent = newQuantity;
}

// เพิ่มสินค้าลงตะกร้า
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const sizeSelect = document.querySelector(`select[data-product-id="${productId}"]`);
    const quantityElement = document.getElementById(`quantity-${productId}`);
    
    const selectedSize = sizeSelect.value;
    const quantity = parseInt(quantityElement.textContent);
    
    if (!selectedSize) {
        alert('กรุณาเลือกไซส์');
        return;
    }
    
    // ตรวจสอบว่ามีสินค้านี้ในตะกร้าแล้วหรือไม่
    const existingItemIndex = cart.findIndex(item => 
        item.productId === productId && item.size === selectedSize
    );
    
    if (existingItemIndex !== -1) {
        // อัพเดทจำนวนสินค้าที่มีอยู่
        cart[existingItemIndex].quantity += quantity;
    } else {
        // เพิ่มสินค้าใหม่
        cart.push({
            productId: productId,
            name: product.name,
            color: product.color,
            size: selectedSize,
            price: product.price,
            quantity: quantity,
            image: product.image
        });
    }
    
    // รีเซ็ตฟอร์ม
    sizeSelect.value = '';
    quantityElement.textContent = '1';
    
    updateCartDisplay();
    showNotification('เพิ่มสินค้าลงตะกร้าแล้ว');
}

// อัพเดทการแสดงผลตะกร้า
function updateCartDisplay() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">ไม่มีสินค้าในตะกร้า</div>';
        totalPriceElement.textContent = '0';
        return;
    }
    
    cartItems.innerHTML = '';
    
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        const itemPrice = ['2XL', '3XL', '4XL', '5XL'].includes(item.size) ? item.price + 20 : item.price;
        const totalItemPrice = itemPrice * item.quantity;
        
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" 
                     onload="this.style.display='block'" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'cart-item-image-placeholder\\'>${item.name}</div>'">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">ไซส์: ${item.size} | จำนวน: ${item.quantity}</div>
                <div class="cart-item-price">${totalItemPrice} บาท</div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${index})">ลบ</button>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    calculateTotal();
}

// ลบสินค้าออกจากตะกร้า
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
    showNotification('ลบสินค้าออกจากตะกร้าแล้ว');
}

// คำนวณราคารวม - แก้ไขให้ถูกต้อง
function calculateTotal() {
    // สร้างรายการสินค้าทั้งหมด (รวมจำนวน)
    let allItems = [];
    cart.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
            allItems.push({
                ...item,
                quantity: 1
            });
        }
    });
    
    let total = 0;
    let itemCount = allItems.length;
    
    if (itemCount >= 3) {
        // โปรโมชั่น 3 ตัว 599 บาท
        let promotionCount = Math.floor(itemCount / 3);
        let remainingItems = itemCount % 3;
        
        // คำนวณราคาสำหรับโปรโมชั่น
        for (let i = 0; i < promotionCount; i++) {
            let promotionItems = allItems.slice(i * 3, (i + 1) * 3);
            let basePrice = 599;
            let extraPrice = 0;
            
            // คำนวณราคาเพิ่มสำหรับไซส์ใหญ่
            promotionItems.forEach(item => {
                if (['2XL', '3XL', '4XL', '5XL'].includes(item.size)) {
                    extraPrice += 20;
                }
            });
            
            total += basePrice + extraPrice;
        }
        
        // คำนวณราคาสำหรับสินค้าที่เหลือ
        for (let i = promotionCount * 3; i < itemCount; i++) {
            let item = allItems[i];
            let itemPrice = item.price;
            if (['2XL', '3XL', '4XL', '5XL'].includes(item.size)) {
                itemPrice += 20;
            }
            total += itemPrice;
        }
    } else {
        // คำนวณราคาปกติ
        allItems.forEach(item => {
            let itemPrice = item.price;
            if (['2XL', '3XL', '4XL', '5XL'].includes(item.size)) {
                itemPrice += 20;
            }
            total += itemPrice;
        });
    }
    
    totalPriceElement.textContent = total;
}

// แสดงการแจ้งเตือน
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// สั่งซื้อ - อัพเดทให้ไปยังหน้าสั่งซื้อ
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('ไม่มีสินค้าในตะกร้า');
        return;
    }
    
    // บันทึกข้อมูลตะกร้าลง localStorage
    localStorage.setItem('ปลูกรักCart', JSON.stringify(cart));
    
    // ไปยังหน้าสั่งซื้อ
    window.location.href = 'purchase.html';
});

// เพิ่ม CSS สำหรับ animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// โหลดข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartDisplay();
}); 