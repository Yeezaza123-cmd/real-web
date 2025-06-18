const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Apply security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use('/api/admin', authLimiter);

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'https://real-web-cxbl.onrender.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB connection
let db;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plukrak';

async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        await client.connect();
        db = client.db();
        console.log('Connected to MongoDB successfully');
        
        // สร้าง index สำหรับการค้นหา
        await db.collection('orders').createIndex({ 'customer.phone': 1 });
        await db.collection('orders').createIndex({ orderId: 1 });
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // ถ้าไม่สามารถเชื่อมต่อ MongoDB ได้ ให้ใช้ไฟล์ JSON แทน
        console.log('Falling back to file system storage');
    }
}

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));
app.use('/orders/slips', express.static('orders/slips', {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

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

// Input validation functions
function validateOrder(order) {
    const errors = [];
    
    // Validate customer info
    if (!order.customer || !order.customer.name || !order.customer.phone) {
        errors.push('ข้อมูลลูกค้าไม่ครบถ้วน');
    }
    
    if (order.customer && order.customer.phone) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(order.customer.phone)) {
            errors.push('เบอร์โทรศัพท์ไม่ถูกต้อง');
        }
    }
    
    // Validate items
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        errors.push('ไม่มีสินค้าในออเดอร์');
    }
    
    // Validate delivery info
    if (!order.delivery || !order.delivery.method) {
        errors.push('ไม่ระบุวิธีรับของ');
    }
    
    if (order.delivery && order.delivery.method === 'delivery' && !order.delivery.address) {
        errors.push('ไม่ระบุที่อยู่จัดส่ง');
    }
    
    return errors;
}

function sanitizeInput(input) {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
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
        // Validate request
        if (!req.body.order) {
            return res.status(400).json({ error: 'ข้อมูลออเดอร์ไม่ครบถ้วน' });
        }
        
        const order = JSON.parse(req.body.order);
        
        // Sanitize input
        if (order.customer) {
            order.customer.name = sanitizeInput(order.customer.name);
            order.customer.phone = sanitizeInput(order.customer.phone);
        }
        
        if (order.delivery && order.delivery.address) {
            order.delivery.address = sanitizeInput(order.delivery.address);
        }
        
        // Validate order
        const validationErrors = validateOrder(order);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }
        
        const orderId = order.orderId;
        order.status = 'wait_slip';
        order.createdAt = new Date();
        
        if (req.file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({ error: 'ประเภทไฟล์ไม่ถูกต้อง' });
            }
            order.slip = `/orders/slips/${req.file.filename}`;
        }
        
        if (db) {
            // ใช้ MongoDB
            await db.collection('orders').insertOne(order);
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
        if (!password || password !== '123321') {
            return res.status(401).json({ error: 'unauthorized' });
        }
        
        let orders = [];
        
        if (db) {
            // ใช้ MongoDB
            orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
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
        
        // Validate input
        if (!orderId || !status) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
        }
        
        const validStatuses = ['wait_slip', 'wait_ship', 'shipped'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
        }
        
        if (db) {
            // ใช้ MongoDB
            const result = await db.collection('orders').updateOne(
                { orderId: orderId },
                { 
                    $set: { 
                        status: status,
                        updatedAt: new Date(),
                        ...(tracking && { tracking: sanitizeInput(tracking) })
                    }
                }
            );
            
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'not found' });
            }
        } else {
            // Fallback ใช้ไฟล์ JSON
            const filePath = `orders/${orderId}.json`;
            if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
            
            const order = JSON.parse(fs.readFileSync(filePath));
            order.status = status;
            if (tracking) order.tracking = sanitizeInput(tracking);
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
        
        // Validate phone number
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' });
        }
        
        let orders = [];
        
        if (db) {
            // ใช้ MongoDB
            orders = await db.collection('orders')
                .find({ 'customer.phone': phone })
                .sort({ createdAt: -1 })
                .toArray();
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