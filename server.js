const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/orders/slips', express.static('orders/slips'));

// ข้อมูลสินค้า
const products = [
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

// Multer config สำหรับอัปโหลดสลิป
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'orders/slips');
    },
    filename: function (req, file, cb) {
        const orderId = req.body.orderId || req.query.orderId || Date.now();
        const ext = file.originalname.split('.').pop();
        cb(null, `${orderId}.${ext}`);
    }
});
const upload = multer({ storage: storage });

// ฟังก์ชันคำนวณราคา - แก้ไขให้ถูกต้อง
function calculatePrice(items) {
    // สร้างรายการสินค้าทั้งหมด (รวมจำนวน)
    let allItems = [];
    items.forEach(item => {
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
    
    return total;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/calculate-price', (req, res) => {
    const { items } = req.body;
    const totalPrice = calculatePrice(items);
    res.json({ totalPrice });
});

// API: รับออเดอร์ใหม่
app.post('/api/order', upload.single('slip'), (req, res) => {
    const order = JSON.parse(req.body.order);
    const orderId = order.orderId;
    order.status = 'wait_slip';
    if (req.file) {
        order.slip = `/orders/slips/${req.file.filename}`;
    }
    fs.writeFileSync(`orders/${orderId}.json`, JSON.stringify(order, null, 2));
    res.json({ success: true, orderId });
});

// API: ดึงออเดอร์ทั้งหมด (admin)
app.get('/api/admin/orders', (req, res) => {
    const password = req.query.password;
    if (password !== '123321') return res.status(401).json({ error: 'unauthorized' });
    const files = fs.readdirSync('orders').filter(f => f.endsWith('.json'));
    const orders = files.map(f => {
        const data = fs.readFileSync(`orders/${f}`);
        return JSON.parse(data);
    });
    res.json(orders);
});

// API: อัปเดตสถานะออเดอร์ (admin)
app.post('/api/admin/update-status', (req, res) => {
    const { orderId, status, tracking } = req.body;
    const filePath = `orders/${orderId}.json`;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
    const order = JSON.parse(fs.readFileSync(filePath));
    order.status = status;
    if (tracking) order.tracking = tracking;
    fs.writeFileSync(filePath, JSON.stringify(order, null, 2));
    res.json({ success: true });
});

// API: ติดตามออเดอร์ด้วยเบอร์โทรศัพท์
app.get('/api/track', (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.json({ orders: [] });
    const files = fs.readdirSync('orders').filter(f => f.endsWith('.json'));
    const orders = files.map(f => {
        const data = fs.readFileSync(`orders/${f}`);
        return JSON.parse(data);
    }).filter(order => order.customer && order.customer.phone === phone);
    res.json({ orders });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 