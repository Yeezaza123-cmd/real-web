document.getElementById('trackForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const phone = document.getElementById('trackPhone').value.trim();
    const resultDiv = document.getElementById('trackResult');
    resultDiv.innerHTML = '<p>กำลังค้นหา...</p>';
    fetch(`/api/track?phone=${encodeURIComponent(phone)}`)
        .then(res => res.json())
        .then(data => {
            if (!data.orders || data.orders.length === 0) {
                resultDiv.innerHTML = '<p style="color:#888;text-align:center;">ไม่พบออเดอร์สำหรับเบอร์นี้</p>';
                return;
            }
            resultDiv.innerHTML = data.orders.map(order => `
                <div class="track-order-card">
                    <div class="track-order-header">ออเดอร์ #${order.orderId} (${order.orderDate ? order.orderDate.slice(0,10) : ''})</div>
                    <div class="track-order-status">สถานะ: ${renderStatus(order.status)}</div>
                    <div class="track-order-items">
                        <strong>สินค้า:</strong><br>
                        ${order.items.map(i => `${i.name} - ${i.size} (x${i.quantity})`).join('<br>')}
                    </div>
                    <div><strong>ยอดรวม:</strong> ${order.grandTotal} บาท</div>
                    ${order.status === 'shipped' && order.delivery.method === 'delivery' && order.tracking ? `<div class="track-order-tracking">เลขพัสดุ: ${order.tracking}</div>` : ''}
                </div>
            `).join('');
        })
        .catch(() => {
            resultDiv.innerHTML = '<p style="color:red;">เกิดข้อผิดพลาดในการค้นหา</p>';
        });
});

function renderStatus(status) {
    switch(status) {
        case 'wait_slip': return 'รอยืนยันสลิป';
        case 'wait_ship': return 'รอจัดส่ง';
        case 'shipped': return 'จัดส่งแล้ว';
        default: return status;
    }
} 