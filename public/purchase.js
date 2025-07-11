// Purchase page JavaScript

// ตัวแปรสำหรับเก็บข้อมูล
let cart = [];
let orderTotal = 0;
let deliveryFee = 0;

// DOM Elements
const orderItems = document.getElementById('orderItems');
const orderTotalElement = document.getElementById('orderTotal');
const paymentAmountElement = document.getElementById('paymentAmount');
const qrSection = document.getElementById('qrSection');
const slipSection = document.getElementById('slipSection');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
const generateQRBtn = document.getElementById('generateQRBtn');
const qrCode = document.getElementById('qrCode');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const slipPreview = document.getElementById('slipPreview');

// โหลดข้อมูลตะกร้าจาก localStorage
function loadCart() {
    const savedCart = localStorage.getItem('ปลูกรักCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        displayOrderSummary();
    } else {
        // ถ้าไม่มีข้อมูลตะกร้า ให้กลับไปหน้าหลัก
        window.location.href = 'index.html';
    }
}

// แสดงสรุปสินค้า
function displayOrderSummary() {
    if (cart.length === 0) {
        orderItems.innerHTML = '<p>ไม่มีสินค้าในตะกร้า</p>';
        return;
    }

    orderItems.innerHTML = '';
    
    cart.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        const itemPrice = item.price;
        const totalItemPrice = itemPrice * item.quantity;
        
        orderItem.innerHTML = `
            <div class="order-item-image">
                <img src="${item.image}" alt="${item.name}" 
                     onload="this.style.display='block'" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:0.8rem;color:#666\\'>${item.name}</div>'">
            </div>
            <div class="order-item-info">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-details">ไซส์: ${item.size} | จำนวน: ${item.quantity}</div>
                <div class="order-item-price">${totalItemPrice} บาท</div>
            </div>
        `;
        
        orderItems.appendChild(orderItem);
    });
    
    calculateOrderTotal();
}

// คำนวณราคารวม
function calculateOrderTotal() {
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
        let promotionCount = Math.floor(itemCount / 3);
        let remainingItems = itemCount % 3;
        for (let i = 0; i < promotionCount; i++) {
            let promotionItems = allItems.slice(i * 3, (i + 1) * 3);
            let basePrice = 599;
            let extraPrice = 0;
            promotionItems.forEach(item => {
                if (item.price > 229) {
                    extraPrice += (item.price - 229);
                }
            });
            total += basePrice + extraPrice;
        }
        for (let i = promotionCount * 3; i < itemCount; i++) {
            let item = allItems[i];
            total += item.price;
        }
    } else {
        allItems.forEach(item => {
            total += item.price;
        });
    }
    orderTotal = total;
    orderTotalElement.textContent = total;
    updatePaymentAmount();
}

// อัพเดทจำนวนเงินที่ต้องชำระ
function updatePaymentAmount() {
    const totalWithDelivery = orderTotal + deliveryFee;
    paymentAmountElement.textContent = totalWithDelivery;
}

// จัดการการเลือกวิธีรับของ
function handleDeliveryMethod() {
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
    const deliveryAddressSection = document.getElementById('deliveryAddressSection');
    const pickupLocationSection = document.getElementById('pickupLocationSection');
    
    if (deliveryMethod) {
        if (deliveryMethod.value === 'delivery') {
            deliveryAddressSection.style.display = 'block';
            pickupLocationSection.style.display = 'none';
            deliveryFee = 40;
        } else {
            deliveryAddressSection.style.display = 'none';
            pickupLocationSection.style.display = 'block';
            deliveryFee = 0;
        }
        updatePaymentAmount();
        checkFormCompletion();
    }
}

// จัดการการเลือกสถานที่นัดรับ
function handlePickupLocation() {
    checkFormCompletion();
}

// ตรวจสอบความสมบูรณ์ของฟอร์ม
function checkFormCompletion() {
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
    
    // ตรวจสอบเบอร์โทร
    const phoneRegex = /^\d{10}$/;
    const isPhoneValid = phoneRegex.test(phone);
    
    let isComplete = fullName && isPhoneValid && deliveryMethod;
    
    if (deliveryMethod) {
        if (deliveryMethod.value === 'delivery') {
            const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
            const postalCode = document.getElementById('postalCode').value.trim();
            const postalCodeRegex = /^\d{5}$/;
            const isPostalCodeValid = postalCodeRegex.test(postalCode);
            isComplete = isComplete && deliveryAddress && isPostalCodeValid;
            
            // Debug
            console.log('Delivery check:', {
                fullName: !!fullName,
                isPhoneValid,
                deliveryMethod: !!deliveryMethod,
                deliveryAddress: !!deliveryAddress,
                isPostalCodeValid,
                isComplete
            });
        } else {
            const pickupLocation = document.getElementById('pickupLocation').value;
            isComplete = isComplete && pickupLocation;
            
            // Debug
            console.log('Pickup check:', {
                fullName: !!fullName,
                isPhoneValid,
                deliveryMethod: !!deliveryMethod,
                pickupLocation: !!pickupLocation,
                isComplete
            });
        }
    }
    
    if (isComplete) {
        qrSection.style.display = 'block';
        confirmOrderBtn.disabled = false;
        console.log('Form is complete, showing QR section');
    } else {
        qrSection.style.display = 'none';
        slipSection.style.display = 'none';
        confirmOrderBtn.disabled = true;
        console.log('Form is incomplete, hiding QR section');
    }
}

// สร้าง QR Code
function generateQRCode() {
    const totalWithDelivery = orderTotal + deliveryFee;
    const qrImageUrl = `https://promptpay.io/0637733932/${totalWithDelivery}.png`;
    
    qrCode.src = qrImageUrl;
    qrCode.style.display = 'block';
    qrPlaceholder.style.display = 'none';
    
    // แสดงส่วนอัปโหลดสลิป
    slipSection.style.display = 'block';
}

// จัดการการอัปโหลดสลิป
function handleSlipUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            slipPreview.innerHTML = `<img src="${e.target.result}" alt="สลิปโอนเงิน">`;
        };
        reader.readAsDataURL(file);
    }
}

// ยืนยันคำสั่งซื้อ
function confirmOrder() {
    // ป้องกันกดซ้ำ
    confirmOrderBtn.disabled = true;

    const formData = new FormData(document.getElementById('purchaseForm'));
    const slipFile = document.getElementById('paymentSlip').files[0];
    
    if (!slipFile) {
        alert('กรุณาอัปโหลดสลิปโอนเงิน');
        confirmOrderBtn.disabled = false;
        return;
    }
    
    // สร้างข้อมูลคำสั่งซื้อ
    const orderData = {
        customer: {
            name: formData.get('fullName'),
            phone: formData.get('phone')
        },
        delivery: {
            method: formData.get('deliveryMethod'),
            address: formData.get('deliveryAddress') || '',
            postalCode: formData.get('postalCode') || '',
            pickupLocation: formData.get('pickupLocation') || ''
        },
        items: cart,
        total: orderTotal,
        deliveryFee: deliveryFee,
        grandTotal: orderTotal + deliveryFee,
        orderDate: new Date().toISOString(),
        orderId: 'PLK' + Date.now()
    };

    // ส่งข้อมูลไป backend
    const sendForm = new FormData();
    sendForm.append('order', JSON.stringify(orderData));
    sendForm.append('orderId', orderData.orderId);
    sendForm.append('slip', slipFile);

    fetch('/api/order', {
        method: 'POST',
        body: sendForm
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(`✅ คำสั่งซื้อสำเร็จ!\n\nรหัสคำสั่งซื้อ: ${orderData.orderId}\nขอบคุณที่ใช้บริการ ปลูกรัก! 🛍️`);
            localStorage.removeItem('ปลูกรักCart');
            window.location.href = 'index.html';
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกออเดอร์');
            confirmOrderBtn.disabled = false;
        }
    })
    .catch(() => {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        confirmOrderBtn.disabled = false;
    });
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
    const form = document.getElementById('purchaseForm');
    let statusMsg = document.getElementById('orderStatusMsg');
    if (!statusMsg) {
        statusMsg = document.createElement('div');
        statusMsg.id = 'orderStatusMsg';
        statusMsg.style = 'color:#dc3545;text-align:center;font-size:1.3rem;margin:1.5rem 0;';
        form.parentNode.insertBefore(statusMsg, form);
    }
    if (!isOrderOpen) {
        statusMsg.textContent = 'ขณะนี้ปิดรับออเดอร์';
        form.style.display = 'none';
    } else {
        statusMsg.textContent = '';
        form.style.display = '';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    
    // ตรวจสอบการเปลี่ยนแปลงฟอร์ม
    document.getElementById('fullName').addEventListener('input', checkFormCompletion);
    document.getElementById('phone').addEventListener('input', checkFormCompletion);
    document.getElementById('deliveryAddress').addEventListener('input', checkFormCompletion);
    document.getElementById('postalCode').addEventListener('input', checkFormCompletion);
    document.getElementById('pickupLocation').addEventListener('change', handlePickupLocation);
    
    // จัดการการเลือกวิธีรับของ
    document.querySelectorAll('input[name="deliveryMethod"]').forEach(radio => {
        radio.addEventListener('change', handleDeliveryMethod);
    });
    
    // สร้าง QR Code
    generateQRBtn.addEventListener('click', generateQRCode);
    
    // อัปโหลดสลิป
    document.getElementById('paymentSlip').addEventListener('change', handleSlipUpload);
    
    // ยืนยันคำสั่งซื้อ
    confirmOrderBtn.addEventListener('click', confirmOrder);
    
    // กลับไปตะกร้า
    document.getElementById('backToCartBtn').addEventListener('click', () => {
        window.location.href = 'index.html#cart';
    });

    // เรียกเช็คสถานะเมื่อโหลดหน้า
    checkOrderStatus();
});
