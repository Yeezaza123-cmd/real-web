// ตัวแปร
let adminPassword = '';
let orders = [];
let currentTab = 'wait_slip';
let currentFilter = 'all';

const adminLoginSection = document.getElementById('adminLoginSection');
const adminPanelSection = document.getElementById('adminPanelSection');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginError = document.getElementById('adminLoginError');
const adminOrdersList = document.getElementById('adminOrdersList');
const adminFilter = document.getElementById('adminFilter');
const tabBtns = document.querySelectorAll('.admin-tab-btn');

// ล็อกอิน
adminLoginBtn.onclick = function() {
    const pwd = adminPasswordInput.value;
    fetch(`/api/admin/orders?password=${encodeURIComponent(pwd)}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                adminLoginError.textContent = 'รหัสผ่านไม่ถูกต้อง';
                adminLoginError.style.display = 'block';
            } else {
                adminPassword = pwd;
                orders = data;
                adminLoginSection.style.display = 'none';
                adminPanelSection.style.display = 'block';
                
                // เพิ่ม event listener สำหรับปุ่มฟิลเตอร์หลังจากแสดง admin panel
                setupFilterButtons();
                
                renderOrders();
            }
        });
};

// ตั้งค่าปุ่มฟิลเตอร์
function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    for (const btn of filterBtns) {
        btn.onclick = function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderOrders();
        };
    }
    
    // ตั้งค่าปุ่มสร้าง PDF
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    if (generatePdfBtn) {
        generatePdfBtn.onclick = generatePdf;
    }
}

// เปลี่ยนแถบ
for (const btn of tabBtns) {
    btn.onclick = function() {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.getAttribute('data-tab');
        
        // แสดง/ซ่อนฟิลเตอร์ตามแถบที่เลือก
        if (currentTab === 'wait_ship' || currentTab === 'shipped') {
            adminFilter.style.display = 'block';
        } else {
            adminFilter.style.display = 'none';
            currentFilter = 'all';
            // รีเซ็ตปุ่มฟิลเตอร์
            const filterBtns = document.querySelectorAll('.filter-btn');
            filterBtns.forEach(b => b.classList.remove('active'));
            if (filterBtns[0]) filterBtns[0].classList.add('active');
        }
        
        renderOrders();
    };
}

// แสดงรายการออเดอร์
function renderOrders() {
    adminOrdersList.innerHTML = '';
    let filtered = orders.filter(o => o.status === currentTab);
    
    // ใช้ฟิลเตอร์เพิ่มเติมสำหรับรอจัดส่งและจัดส่งแล้ว
    if ((currentTab === 'wait_ship' || currentTab === 'shipped') && currentFilter !== 'all') {
        filtered = filtered.filter(o => o.delivery.method === currentFilter);
    }
    
    if (filtered.length === 0) {
        adminOrdersList.innerHTML = '<p style="text-align:center;color:#888;">ไม่มีออเดอร์ในสถานะนี้</p>';
        return;
    }
    filtered.sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));
    for (const order of filtered) {
        const card = document.createElement('div');
        card.className = 'admin-order-card';
        card.innerHTML = `
            <div class="admin-order-header">
                <span>ออเดอร์ #${order.orderId}</span>
                <span>${order.orderDate ? order.orderDate.slice(0, 10) : ''}</span>
            </div>
            <div class="admin-order-info">
                <div class="admin-order-customer">
                    <strong>ข้อมูลลูกค้า</strong><br>
                    ชื่อ: ${order.customer.name}<br>
                    เบอร์โทร: ${order.customer.phone}<br>
                    วิธีรับสินค้า: ${order.delivery.method === 'delivery' ? 'จัดส่ง' : 'นัดรับ'}<br>
                    ${order.delivery.method === 'delivery' ? `ที่อยู่: ${order.delivery.address}` : ''}
                    ${order.delivery.method === 'pickup' ? `ที่นัดรับ: ${order.delivery.pickupLocation}` : ''}
                </div>
                <div class="admin-order-items">
                    <strong>รายการสินค้า</strong>
                    <ul class="admin-order-items-list">
                        ${order.items.map(i => `${i.name} - ${i.size} (x${i.quantity}) - ฿${['2XL','3XL','4XL','5XL'].includes(i.size)?i.price+20:i.price}`).join('<br>')}
                    </ul>
                    <div class="admin-order-total">รวมทั้งสิ้น: ฿${order.grandTotal}</div>
                </div>
            </div>
            <div class="admin-order-actions">
                ${order.status === 'wait_slip' && order.slip ? `<button class="view-slip" onclick="showSlipModal('${order.slip}')">ดูสลิปการโอน</button>` : ''}
                ${order.status === 'wait_slip' ? `<button class="confirm" onclick="confirmSlip('${order.orderId}')">ยืนยันสลิป</button>` : ''}
                ${order.status === 'wait_ship' && order.delivery.method === 'delivery' ? `<input type="text" id="tracking_${order.orderId}" placeholder="เลขพัสดุ"><button class="ship" onclick="confirmShip('${order.orderId}')">ยืนยันจัดส่ง</button>` : ''}
                ${order.status === 'wait_ship' && order.delivery.method === 'pickup' ? `<button class="ship" onclick="confirmShip('${order.orderId}')">ยืนยันนัดรับแล้ว</button>` : ''}
                ${order.status === 'shipped' && order.tracking ? `<span>เลขพัสดุ: ${order.tracking}</span>` : ''}
            </div>
        `;
        adminOrdersList.appendChild(card);
    }
}

// ฟังก์ชันดูสลิป
window.showSlipModal = function(slipUrl) {
    const modal = document.createElement('div');
    modal.className = 'admin-slip-modal';
    modal.innerHTML = `
        <div class="admin-slip-modal-content">
            <img src="${slipUrl}" alt="slip">
            <button onclick="document.body.removeChild(this.parentElement.parentElement)">ปิด</button>
        </div>
    `;
    document.body.appendChild(modal);
};

// ฟังก์ชันยืนยันสลิป
window.confirmSlip = function(orderId) {
    if (!confirm('ยืนยันสลิปสำหรับออเดอร์นี้?')) return;
    fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'wait_ship' })
    })
    .then(res => res.json())
    .then(() => reloadOrders());
};

// ฟังก์ชันยืนยันจัดส่ง
window.confirmShip = function(orderId) {
    let tracking = '';
    const input = document.getElementById('tracking_' + orderId);
    if (input) tracking = input.value.trim();
    if (!confirm('ยืนยันจัดส่งออเดอร์นี้?')) return;
    fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'shipped', tracking })
    })
    .then(res => res.json())
    .then(() => reloadOrders());
};

// โหลดออเดอร์ใหม่
function reloadOrders() {
    fetch(`/api/admin/orders?password=${encodeURIComponent(adminPassword)}`)
        .then(res => res.json())
        .then(data => {
            orders = data;
            renderOrders();
        });
}

// สร้างไฟล์สำหรับพิมพ์
function generatePdf() {
    // สร้าง HTML content
    let htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>รายการออเดอร์ - ปลูกรัก</title>
    <style>
        @page {
            size: A4;
            margin: 10mm;
        }
        body {
            font-family: 'Sarabun', Arial, sans-serif;
            margin: 0;
            padding: 0;
            font-size: 18px;
        }
        .orders-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(3, 1fr);
            gap: 10px;
            height: calc(100vh - 100px);
        }
        .order-card {
            border: 1px solid #ccc;
            padding: 8px;
            border-radius: 5px;
            background: #f9f9f9;
            page-break-inside: avoid;
        }
        .order-header {
            font-weight: bold;
            font-size: 17px;
            margin-bottom: 5px;
            color: #333;
        }
        .order-info {
            font-size: 15px;
            line-height: 1.2;
            margin-bottom: 3px;
        }
        .order-items {
            font-size: 14px;
            margin-top: 5px;
        }
        .order-total {
            font-weight: bold;
            font-size: 16px;
            color: #d32f2f;
            margin-top: 5px;
        }
        @media print {
            body { margin: 0; }
            .orders-grid { height: 100vh; }
        }
    </style>
</head>
<body>
    <div class="orders-grid">
`;

    // เรียงลำดับออเดอร์ตามวันที่
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.orderDate || 0) - new Date(a.orderDate || 0)
    );

    // กรองเฉพาะออเดอร์ที่มีสถานะ "รอจัดส่ง"
    const waitShipOrders = sortedOrders.filter(order => order.status === 'wait_ship');

    let orderIndex = 0;

    for (const order of waitShipOrders) {
        // ขึ้นหน้าใหม่ทุก 6 ออเดอร์
        if (orderIndex > 0 && orderIndex % 6 === 0) {
            htmlContent += `
    </div>
    <div style="page-break-before: always;"></div>
    <div class="orders-grid">
`;
        }

        // วิธีรับสินค้า
        const deliveryMethod = order.delivery.method === 'delivery' ? 'จัดส่ง' : 'นัดรับ';
        
        // สถานที่
        const location = order.delivery.method === 'delivery' 
            ? order.delivery.address 
            : order.delivery.pickupLocation;
        
        // รายการสินค้า (แสดงแค่ 2 รายการแรก)
        const itemsText = order.items.slice(0, 2).map(item => 
            `${item.name} ${item.size} (x${item.quantity})`
        ).join('<br>');
        const moreItems = order.items.length > 2 ? `<br>... และอีก ${order.items.length - 2} รายการ` : '';

        htmlContent += `
        <div class="order-card">
            <div class="order-header">ออเดอร์ #${order.orderId}</div>
            <div class="order-info">วันที่: ${order.orderDate ? order.orderDate.slice(0, 10) : 'N/A'}</div>
            <div class="order-info">ชื่อ: ${order.customer.name}</div>
            <div class="order-info">โทร: ${order.customer.phone}</div>
            <div class="order-info">วิธีรับ: ${deliveryMethod}</div>
            <div class="order-info">สถานที่: ${location}</div>
            <div class="order-items">
                <strong>สินค้า:</strong><br>
                ${itemsText}${moreItems}
            </div>
            <div class="order-total">รวม: ฿${order.grandTotal}</div>
        </div>
`;

        orderIndex++;
    }

    htmlContent += `
    </div>
</body>
</html>`;

    // สร้างไฟล์ HTML และดาวน์โหลด
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
} 