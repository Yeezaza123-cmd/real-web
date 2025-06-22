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

// สร้างไฟล์ PDF
function generatePdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // ตั้งค่าขนาดหน้า A4
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // ขนาดของแต่ละออเดอร์ (1/6 ของหน้า A4)
    const orderWidth = pageWidth / 2; // 2 คอลัมน์
    const orderHeight = pageHeight / 3; // 3 แถว
    
    // ตั้งค่าฟอนต์
    doc.setFont('helvetica');
    
    let currentPage = 0;
    let orderIndex = 0;
    
    // เรียงลำดับออเดอร์ตามวันที่
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.orderDate || 0) - new Date(a.orderDate || 0)
    );
    
    for (const order of sortedOrders) {
        // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
        if (orderIndex % 6 === 0) {
            if (currentPage > 0) {
                doc.addPage();
            }
            currentPage++;
            
            // หัวข้อหน้า
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('รายการออเดอร์ทั้งหมด - ปลูกรัก', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`, pageWidth / 2, 25, { align: 'center' });
        }
        
        // คำนวณตำแหน่งของออเดอร์ในหน้า
        const row = Math.floor((orderIndex % 6) / 2);
        const col = (orderIndex % 6) % 2;
        const x = col * orderWidth + 10;
        const y = row * orderHeight + 35;
        
        // วาดกรอบออเดอร์
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(x, y, orderWidth - 20, orderHeight - 15);
        
        // ข้อมูลออเดอร์
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`ออเดอร์ #${order.orderId}`, x + 5, y + 8);
        
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(`วันที่: ${order.orderDate ? order.orderDate.slice(0, 10) : 'N/A'}`, x + 5, y + 15);
        doc.text(`ชื่อ: ${order.customer.name}`, x + 5, y + 22);
        doc.text(`โทร: ${order.customer.phone}`, x + 5, y + 29);
        
        // วิธีรับสินค้า
        const deliveryMethod = order.delivery.method === 'delivery' ? 'จัดส่ง' : 'นัดรับ';
        doc.text(`วิธีรับ: ${deliveryMethod}`, x + 5, y + 36);
        
        // สถานะ
        let statusText = '';
        switch(order.status) {
            case 'wait_slip': statusText = 'รอยืนยันสลิป'; break;
            case 'wait_ship': statusText = 'รอจัดส่ง'; break;
            case 'shipped': statusText = 'จัดส่งแล้ว'; break;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`สถานะ: ${statusText}`, x + 5, y + 43);
        
        // รายการสินค้า (แสดงแค่ 2 รายการแรก)
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text('สินค้า:', x + 5, y + 50);
        order.items.slice(0, 2).forEach((item, index) => {
            const itemText = `${item.name} ${item.size} (x${item.quantity})`;
            doc.text(itemText, x + 5, y + 55 + (index * 5));
        });
        if (order.items.length > 2) {
            doc.text(`... และอีก ${order.items.length - 2} รายการ`, x + 5, y + 65);
        }
        
        // ราคารวม
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(`รวม: ฿${order.grandTotal}`, x + 5, y + orderHeight - 20);
        
        orderIndex++;
    }
    
    // บันทึกไฟล์
    const fileName = `orders_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
} 