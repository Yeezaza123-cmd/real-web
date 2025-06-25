// ตัวแปรสำหรับเก็บข้อมูล
let products = [];
let cart = [];

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const totalPriceElement = document.getElementById('totalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');

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
                sizes: [
                    { size: 'S', price: 229 },
                    { size: 'M', price: 229 },
                    { size: 'L', price: 229 },
                    { size: 'XL', price: 229 },
                    { size: '2XL', price: 249 },
                    { size: '3XL', price: 259 },
                    { size: '4XL', price: 269 },
                    { size: '5XL', price: 279 },
                    { size: '6XL', price: 289 }
                ]
            },
            {
                id: 2,
                name: 'เสื้อสีน้ำตาล',
                color: 'brown',
                price: 229,
                image: '/images/brown.png',
                sizes: [
                    { size: 'S', price: 229 },
                    { size: 'M', price: 229 },
                    { size: 'L', price: 229 },
                    { size: 'XL', price: 229 },
                    { size: '2XL', price: 249 },
                    { size: '3XL', price: 259 },
                    { size: '4XL', price: 269 },
                    { size: '5XL', price: 279 },
                    { size: '6XL', price: 289 }
                ]
            },
            {
                id: 3,
                name: 'เสื้อสีขาว',
                color: 'white',
                price: 229,
                image: '/images/white.png',
                sizes: [
                    { size: 'S', price: 229 },
                    { size: 'M', price: 229 },
                    { size: 'L', price: 229 },
                    { size: 'XL', price: 229 },
                    { size: '2XL', price: 249 },
                    { size: '3XL', price: 259 },
                    { size: '4XL', price: 269 },
                    { size: '5XL', price: 279 },
                    { size: '6XL', price: 289 }
                ]
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
                <p class="product-price">เริ่มต้น ${product.sizes[0].price} บาท</p>
                <div class="product-controls">
                    <select class="size-select" data-product-id="${product.id}">
                        <option value="">เลือกไซส์</option>
                        ${product.sizes.map(sizeObj => {
                            return `<option value="${sizeObj.size}" data-price="${sizeObj.price}">${sizeObj.size} (${sizeObj.price})</option>`;
                        }).join('')}
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
    // ดึงราคาตามไซต์
    const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
    const selectedPrice = parseInt(selectedOption.getAttribute('data-price'));
    
    // ตรวจสอบว่ามีสินค้าไซต์นี้ในตะกร้าหรือยัง
    const existingItemIndex = cart.findIndex(item => 
        item.productId === productId && item.size === selectedSize
    );
    
    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            productId: productId,
            name: product.name,
            color: product.color,
            size: selectedSize,
            price: selectedPrice,
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
        
        const totalItemPrice = item.price * item.quantity;
        
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
    let total = 0;
    let itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // เรียงลำดับสินค้าในตะกร้าจากราคามากไปน้อย
    let sortedCartItems = [];
    cart.forEach(item => {
        for(let i=0; i<item.quantity; i++){
            sortedCartItems.push({ ...item, quantity: 1});
        }
    });
    sortedCartItems.sort((a, b) => b.price - a.price);

    const promoAppliedItems = new Array(sortedCartItems.length).fill(false);
    
    // ใช้โปรโมชั่น 3 ตัว 599
    const numPromos = Math.floor(itemCount / 3);
    for (let i = 0; i < numPromos; i++) {
        total += 599;
        // ทำเครื่องหมาย 3 รายการที่ถูกที่สุดว่าใช้โปรโมชั่นแล้ว
        let promoCount = 0;
        for (let j = sortedCartItems.length - 1; j >= 0 && promoCount < 3; j--) {
            if (!promoAppliedItems[j]) {
                promoAppliedItems[j] = true;
                promoCount++;
            }
        }
    }
    
    // คำนวณราคาสินค้าที่เหลือ
    let remainingItemsTotal = 0;
    for (let i = 0; i < sortedCartItems.length; i++) {
        if (!promoAppliedItems[i]) {
            remainingItemsTotal += sortedCartItems[i].price;
        }
    }

    total += remainingItemsTotal;

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

// ตัวแปรสำหรับภาพเลื่อน
let currentSlide = 0;
let sliderImages = [];
let autoSlideInterval;

// โหลดภาพเลื่อน
async function loadSliderImages() {
    try {
        const response = await fetch('/api/slider-images');
        const data = await response.json();
        
        if (data.images && data.images.length > 0) {
            sliderImages = data.images;
            createSlider();
        } else {
            showComingSoon();
        }
    } catch (error) {
        console.error('Error loading slider images:', error);
        showComingSoon();
    }
}

// สร้างภาพเลื่อน
function createSlider() {
    const sliderWrapper = document.getElementById('sliderWrapper');
    sliderWrapper.innerHTML = '';
    sliderImages.forEach((image, index) => {
        const slide = document.createElement('div');
        slide.className = 'slider-slide';
        slide.innerHTML = `<img src="${image.url}" alt="ภาพโฆษณา ${index + 1}">`;
        sliderWrapper.appendChild(slide);
    });
    sliderWrapper.onclick = function(e) {
        const rect = sliderWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) {
            prevSlide();
        } else {
            nextSlide();
        }
    };
    startAutoSlide();
    sliderWrapper.addEventListener('mouseenter', stopAutoSlide);
    sliderWrapper.addEventListener('mouseleave', startAutoSlide);
}

// แสดง Coming Soon
function showComingSoon() {
    const sliderWrapper = document.getElementById('sliderWrapper');
    const sliderDots = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    sliderWrapper.innerHTML = '<div class="slider-slide coming-soon">🎉 Coming Soon! 🎉<br>ภาพโฆษณาสวยๆ กำลังจะมา</div>';
    sliderDots.innerHTML = '';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
}

// ไปยังภาพที่กำหนด
function goToSlide(index) {
    if (index < 0 || index >= sliderImages.length) return;
    currentSlide = index;
    const sliderWrapper = document.getElementById('sliderWrapper');
    sliderWrapper.style.transform = `translateX(-${index * 100}%)`;
}

// ภาพถัดไป
function nextSlide() {
    const nextIndex = (currentSlide + 1) % sliderImages.length;
    goToSlide(nextIndex);
}

// ภาพก่อนหน้า
function prevSlide() {
    const prevIndex = currentSlide === 0 ? sliderImages.length - 1 : currentSlide - 1;
    goToSlide(prevIndex);
}

// เริ่มเลื่อนอัตโนมัติ
function startAutoSlide() {
    if (sliderImages.length <= 1) return;
    
    stopAutoSlide(); // หยุดการเลื่อนเดิมก่อน
    autoSlideInterval = setInterval(() => {
        nextSlide();
    }, 3000); // เลื่อนทุก 3 วินาที
}

// หยุดเลื่อนอัตโนมัติ
function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

// โหลดข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCartFromStorage(); // โหลดข้อมูลตะกร้าจาก localStorage
    updateCartDisplay();
    loadSliderImages(); // โหลดภาพเลื่อน
    checkOrderStatus();
});

// โหลดข้อมูลตะกร้าจาก localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('ปลูกรักCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartDisplay();
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            cart = [];
            localStorage.removeItem('ปลูกรักCart');
        }
    }
}

// เช็คสถานะเปิด/ปิดรับออเดอร์
let isOrderOpen = true;
function checkOrderStatus() {
    fetch('/api/order-status')
        .then(res => res.json())
        .then(data => {
            isOrderOpen = !!data.open;
            updateOrderStatusDisplay();
        });
}
function updateOrderStatusDisplay() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    let statusMsg = document.getElementById('orderStatusMsg');
    if (!statusMsg) {
        statusMsg = document.createElement('div');
        statusMsg.id = 'orderStatusMsg';
        statusMsg.style = 'color:#dc3545;text-align:center;font-size:1.3rem;margin:1.5rem 0;';
        checkoutBtn.parentNode.insertBefore(statusMsg, checkoutBtn);
    }
    if (!isOrderOpen) {
        statusMsg.textContent = 'ขณะนี้ปิดรับออเดอร์';
        checkoutBtn.disabled = true;
    } else {
        statusMsg.textContent = '';
        checkoutBtn.disabled = false;
    }
}
// เรียกเช็คสถานะเมื่อโหลดหน้า
checkOrderStatus(); 