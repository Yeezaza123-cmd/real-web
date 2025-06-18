// ตัวแปร
let adminPassword = '';
let orders = [];
let currentTab = 'wait_slip';

const adminLoginSection = document.getElementById('adminLoginSection');
const adminPanelSection = document.getElementById('adminPanelSection');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginError = document.getElementById('adminLoginError');
const adminOrdersList = document.getElementById('adminOrdersList');
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
                renderOrders();
            }
        });
};

// เปลี่ยนแถบ
for (const btn of tabBtns) {
    btn.onclick = function() {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.getAttribute('data-tab');
        renderOrders();
    };
}

// แสดงรายการออเดอร์
function renderOrders() {
    adminOrdersList.innerHTML = '';
    const filtered = orders.filter(o => o.status === currentTab);
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
                    ${order.delivery.method === 'pickup' ? `ที่นัดรับ: ${order.delivery.pickupLocation}${order.delivery.otherLocation ? ' (' + order.delivery.otherLocation + ')' : ''}` : ''}
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