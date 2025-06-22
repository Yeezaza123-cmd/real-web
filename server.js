const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas Data API
let db;
const MONGODB_API_KEY = process.env.MONGODB_API_KEY || 'your-api-key';
const MONGODB_CLUSTER_URL = process.env.MONGODB_CLUSTER_URL || 'https://data.mongodb-api.com/app/data-cnksbrf/endpoint/data/v1';
const MONGODB_DATABASE = 'plukrak';
const MONGODB_COLLECTION = 'orders';

async function connectToMongoDB() {
    try {
        // ตรวจสอบว่ามี MONGODB_API_KEY หรือไม่
        if (!process.env.MONGODB_API_KEY) {
            console.log('MONGODB_API_KEY not found, using file system storage');
            return;
        }
        
        console.log('Connected to MongoDB Atlas Data API successfully');
        
        // ย้ายข้อมูลจากไฟล์ JSON ไป MongoDB (ถ้ามี)
        await migrateDataFromFiles();
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.log('Falling back to file system storage');
    }
}

// ฟังก์ชัน MongoDB Data API
async function mongoInsertOne(document) {
    try {
        const response = await fetch(`${MONGODB_CLUSTER_URL}/action/insertOne`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': MONGODB_API_KEY,
            },
            body: JSON.stringify({
                dataSource: 'Cluster0',
                database: MONGODB_DATABASE,
                collection: MONGODB_COLLECTION,
                document: document
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('MongoDB insert error:', error);
        throw error;
    }
}

async function mongoFind(query = {}) {
    try {
        const response = await fetch(`${MONGODB_CLUSTER_URL}/action/find`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': MONGODB_API_KEY,
            },
            body: JSON.stringify({
                dataSource: 'Cluster0',
                database: MONGODB_DATABASE,
                collection: MONGODB_COLLECTION,
                filter: query,
                sort: { createdAt: -1 }
            })
        });
        
        const result = await response.json();
        return result.documents || [];
    } catch (error) {
        console.error('MongoDB find error:', error);
        throw error;
    }
}

async function mongoUpdateOne(filter, update) {
    try {
        const response = await fetch(`${MONGODB_CLUSTER_URL}/action/updateOne`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': MONGODB_API_KEY,
            },
            body: JSON.stringify({
                dataSource: 'Cluster0',
                database: MONGODB_DATABASE,
                collection: MONGODB_COLLECTION,
                filter: filter,
                update: { $set: update }
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('MongoDB update error:', error);
        throw error;
    }
}

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
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL']
    },
    {
        id: 2,
        name: 'เสื้อสีน้ำตาล',
        color: 'brown',
        price: 229,
        image: '/images/brown.png',
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL']
    },
    {
        id: 3,
        name: 'เสื้อสีขาว',
        color: 'white',
        price: 229,
        image: '/images/white.png',
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL']
    }
];

// Multer config สำหรับอัปโหลดสลิป
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // สร้างโฟลเดอร์ถ้ายังไม่มี
        const uploadDir = 'orders/slips';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const orderId = req.body.orderId || req.query.orderId || Date.now();
        const ext = file.originalname.split('.').pop();
        cb(null, `${orderId}.${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ 5MB
    },
    fileFilter: function (req, file, cb) {
        // ตรวจสอบประเภทไฟล์
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'), false);
        }
    }
});

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

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: db ? 'MongoDB Connected' : 'File System'
    });
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
app.post('/api/order', upload.single('slip'), async (req, res) => {
    try {
        const order = JSON.parse(req.body.order);
        const orderId = order.orderId;
        order.status = 'wait_slip';
        order.createdAt = new Date();
        
        if (req.file) {
            order.slip = `/orders/slips/${req.file.filename}`;
        }
        
        if (db) {
            // ใช้ MongoDB
            await mongoInsertOne(order);
        } else {
            // Fallback ใช้ไฟล์ JSON
            if (!fs.existsSync('orders')) {
                fs.mkdirSync('orders', { recursive: true });
            }
            fs.writeFileSync(`orders/${orderId}.json`, JSON.stringify(order, null, 2));
        }
        
        res.json({ success: true, orderId });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างออเดอร์' });
    }
});

// API: ดึงออเดอร์ทั้งหมด (admin)
app.get('/api/admin/orders', async (req, res) => {
    try {
        const password = req.query.password;
        if (password !== '123321') return res.status(401).json({ error: 'unauthorized' });
        
        let orders = [];
        
        if (db) {
            // ใช้ MongoDB
            orders = await mongoFind();
        } else {
            // Fallback ใช้ไฟล์ JSON
            if (!fs.existsSync('orders')) {
                return res.json([]);
            }
            const files = fs.readdirSync('orders').filter(f => f.endsWith('.json'));
            orders = files.map(f => {
                const data = fs.readFileSync(`orders/${f}`);
                return JSON.parse(data);
            });
        }
        
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์' });
    }
});

// API: อัปเดตสถานะออเดอร์ (admin)
app.post('/api/admin/update-status', async (req, res) => {
    try {
        const { orderId, status, tracking } = req.body;
        
        if (db) {
            // ใช้ MongoDB
            await mongoUpdateOne(
                { orderId: orderId },
                { 
                    $set: { 
                        status: status,
                        updatedAt: new Date(),
                        ...(tracking && { tracking: tracking })
                    }
                }
            );
        } else {
            // Fallback ใช้ไฟล์ JSON
            const filePath = `orders/${orderId}.json`;
            if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
            
            const order = JSON.parse(fs.readFileSync(filePath));
            order.status = status;
            if (tracking) order.tracking = tracking;
            fs.writeFileSync(filePath, JSON.stringify(order, null, 2));
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
});

// API: ติดตามออเดอร์ด้วยเบอร์โทรศัพท์
app.get('/api/track', async (req, res) => {
    try {
        const phone = req.query.phone;
        if (!phone) return res.json({ orders: [] });
        
        let orders = [];
        
        if (db) {
            // ใช้ MongoDB
            orders = await mongoFind({ 'customer.phone': phone });
        } else {
            // Fallback ใช้ไฟล์ JSON
            if (!fs.existsSync('orders')) {
                return res.json({ orders: [] });
            }
            const files = fs.readdirSync('orders').filter(f => f.endsWith('.json'));
            orders = files.map(f => {
                const data = fs.readFileSync(`orders/${f}`);
                return JSON.parse(data);
            }).filter(order => order.customer && order.customer.phone === phone);
        }
        
        res.json({ orders });
    } catch (error) {
        console.error('Error tracking orders:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการติดตามออเดอร์' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'ไม่พบหน้าที่ต้องการ' });
});

// Start server
async function startServer() {
    await connectToMongoDB();
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Database: ${db ? 'MongoDB' : 'File System'}`);
    });
}

startServer(); 