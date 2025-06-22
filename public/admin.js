// ตัวแปร
let adminPassword = '';
let orders = [];
let currentTab = 'wait_slip';
let currentFilter = 'all';
let autoRefreshInterval = null;

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
                
                // เริ่ม auto-refresh
                startAutoRefresh();
                
                renderOrders();
            }
        });
};

// เริ่ม auto-refresh
function startAutoRefresh() {
    // หยุด auto-refresh เดิม (ถ้ามี)
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // เริ่ม auto-refresh ใหม่ทุก 30 วินาที
    autoRefreshInterval = setInterval(() => {
        reloadOrders();
    }, 30000); // 30 วินาที
}

// หยุด auto-refresh
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

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
    filtered.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
    for (const order of filtered) {
        const card = document.createElement('div');
        card.className = 'admin-order-card';
        card.innerHTML = `
            <div class="admin-order-header">
                <span>ออเดอร์ #${order.orderId}</span>
                <span>${order.orderDate ? new Date(order.orderDate).toLocaleString('th-TH', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Bangkok'
                }) : ''}</span>
            </div>
            ${order.status === 'deleted' && order.deletedAt ? `<div style="color: #dc3545; font-size: 0.9rem; margin-bottom: 0.5rem;">ถูกลบเมื่อ: ${new Date(order.deletedAt).toLocaleString('th-TH', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Bangkok'
            })}</div>` : ''}
            ${order.restoredAt ? `<div style="color: #17a2b8; font-size: 0.9rem; margin-bottom: 0.5rem;">กู้คืนเมื่อ: ${new Date(order.restoredAt).toLocaleString('th-TH', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Bangkok'
            })}</div>` : ''}
            <div class="admin-order-info">
                <div class="admin-order-customer">
                    <strong>ข้อมูลลูกค้า</strong><br>
                    ชื่อ: ${order.customer.name}<br>
                    เบอร์โทร: ${order.customer.phone}<br>
                    วิธีรับสินค้า: ${order.delivery.method === 'delivery' ? 'จัดส่ง' : 'นัดรับ'}<br>
                    ${order.delivery.method === 'delivery' ? `ที่อยู่: ${order.delivery.address}` : ''}
                    ${order.delivery.method === 'delivery' ? `รหัสไปรษณีย์: ${order.delivery.postalCode}` : ''}
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
                ${order.status !== 'deleted' ? `<button class="delete-order" onclick="deleteOrder('${order.orderId}')">ลบออเดอร์</button>` : ''}
                ${order.status === 'deleted' ? `<span style="color: #dc3545; font-weight: bold;">ถูกลบแล้ว</span><button class="restore-order" onclick="restoreOrder('${order.orderId}')">กู้คืน</button>` : ''}
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
    
    // ตรวจสอบสถานะปัจจุบันก่อนอัปเดต
    const currentOrder = orders.find(o => o.orderId === orderId);
    if (!currentOrder) {
        alert('ไม่พบออเดอร์นี้');
        return;
    }
    
    if (currentOrder.status !== 'wait_slip') {
        alert('ออเดอร์นี้ได้ถูกยืนยันแล้ว กรุณารีเฟรชหน้าเว็บ');
        reloadOrders();
        return;
    }
    
    fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'wait_ship' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            reloadOrders();
        } else {
            alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    });
};

// ฟังก์ชันยืนยันจัดส่ง
window.confirmShip = function(orderId) {
    let tracking = '';
    const input = document.getElementById('tracking_' + orderId);
    if (input) tracking = input.value.trim();
    if (!confirm('ยืนยันจัดส่งออเดอร์นี้?')) return;
    
    // ตรวจสอบสถานะปัจจุบันก่อนอัปเดต
    const currentOrder = orders.find(o => o.orderId === orderId);
    if (!currentOrder) {
        alert('ไม่พบออเดอร์นี้');
        return;
    }
    
    if (currentOrder.status !== 'wait_ship') {
        alert('ออเดอร์นี้ได้ถูกยืนยันแล้ว กรุณารีเฟรชหน้าเว็บ');
        reloadOrders();
        return;
    }
    
    fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'shipped', tracking })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            reloadOrders();
        } else {
            alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    });
};

// ฟังก์ชันลบออเดอร์
window.deleteOrder = function(orderId) {
    if (!confirm('คุณต้องการลบออเดอร์ #' + orderId + ' หรือไม่?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้!')) {
        return;
    }
    
    // ตรวจสอบสถานะปัจจุบัน
    const currentOrder = orders.find(o => o.orderId === orderId);
    if (!currentOrder) {
        alert('ไม่พบออเดอร์นี้');
        return;
    }
    
    // ถามยืนยันเพิ่มเติมสำหรับออเดอร์ที่จัดส่งแล้ว
    if (currentOrder.status === 'shipped') {
        if (!confirm('ออเดอร์นี้ได้จัดส่งแล้ว คุณแน่ใจหรือไม่ที่จะลบ?')) {
            return;
        }
    }
    
    fetch('/api/admin/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            orderId: orderId,
            password: adminPassword 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('ลบออเดอร์สำเร็จ');
            reloadOrders();
        } else {
            alert(data.error || 'เกิดข้อผิดพลาดในการลบออเดอร์');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    });
};

// ฟังก์ชันกู้คืนออเดอร์
window.restoreOrder = function(orderId) {
    if (!confirm('คุณต้องการกู้คืนออเดอร์ #' + orderId + ' หรือไม่?')) {
        return;
    }
    
    fetch('/api/admin/restore-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            orderId: orderId,
            password: adminPassword 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('กู้คืนออเดอร์สำเร็จ');
            reloadOrders();
        } else {
            alert(data.error || 'เกิดข้อผิดพลาดในการกู้คืนออเดอร์');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    });
};

// โหลดออเดอร์ใหม่
function reloadOrders() {
    // แสดงสถานะการโหลด
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="loading">กำลังโหลดข้อมูล...</div>';
    loadingIndicator.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,255,255,0.9);padding:20px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;';
    
    // เพิ่ม loading indicator เฉพาะเมื่อไม่ใช่ auto-refresh
    if (!autoRefreshInterval) {
        document.body.appendChild(loadingIndicator);
    }
    
    fetch(`/api/admin/orders?password=${encodeURIComponent(adminPassword)}`)
        .then(res => res.json())
        .then(data => {
            orders = data;
            renderOrders();
            
            // ลบ loading indicator
            const indicator = document.getElementById('loading-indicator');
            if (indicator) {
                document.body.removeChild(indicator);
            }
        })
        .catch(error => {
            console.error('Error reloading orders:', error);
            
            // ลบ loading indicator
            const indicator = document.getElementById('loading-indicator');
            if (indicator) {
                document.body.removeChild(indicator);
            }
            
            // แสดงข้อความผิดพลาดเฉพาะเมื่อไม่ใช่ auto-refresh
            if (!autoRefreshInterval) {
                alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            }
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
            gap: 15px;
        }
        .order-card {
            border: 1px solid #ccc;
            padding: 12px;
            border-radius: 8px;
            background: #f9f9f9;
            page-break-inside: avoid;
            margin-bottom: 15px;
        }
        .order-header {
            font-weight: bold;
            font-size: 17px;
            margin-bottom: 8px;
            color: #333;
        }
        .order-info {
            font-size: 15px;
            line-height: 1.3;
            margin-bottom: 5px;
        }
        .order-items {
            font-size: 14px;
            margin-top: 8px;
        }
        .order-total {
            font-weight: bold;
            font-size: 16px;
            color: #d32f2f;
            margin-top: 8px;
        }
        @media print {
            body { margin: 0; }
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
        // วิธีรับสินค้า
        const deliveryMethod = order.delivery.method === 'delivery' ? 'จัดส่ง' : 'นัดรับ';
        
        // สถานที่
        const location = order.delivery.method === 'delivery' 
            ? order.delivery.address 
            : order.delivery.pickupLocation;
        
        // รายการสินค้า (แสดงทั้งหมด)
        const itemsText = order.items.map(item => 
            `${item.name} ${item.size} (x${item.quantity})`
        ).join('<br>');

        htmlContent += `
        <div class="order-card">
            <div class="order-header">ออเดอร์ #${order.orderId}</div>
            <div class="order-info">วันที่: ${order.orderDate ? new Date(order.orderDate).toLocaleString('th-TH', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Bangkok'
            }) : 'N/A'}</div>
            <div class="order-info">ชื่อ: ${order.customer.name}</div>
            <div class="order-info">โทร: ${order.customer.phone}</div>
            <div class="order-info">วิธีรับ: ${deliveryMethod}</div>
            <div class="order-info">สถานที่: ${location}</div>
            ${order.delivery.method === 'delivery' ? `<div class="order-info">รหัสไปรษณีย์: ${order.delivery.postalCode}</div>` : ''}
            <div class="order-items">
                <strong>สินค้า:</strong><br>
                ${itemsText}
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
    const now = new Date().toLocaleString('th-TH', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
    }).replace(/[/:]/g, '-').replace(/\s/g, '_');
    a.download = `orders_${now}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// หยุด auto-refresh เมื่อออกจากหน้าเว็บ
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

// หยุด auto-refresh เมื่อแท็บไม่ active
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopAutoRefresh();
    } else if (adminPassword) {
        startAutoRefresh();
    }
}); 