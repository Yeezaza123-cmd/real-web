# Plukrak - เว็บไซต์ช้อปปิ้งเสื้อผ้า

เว็บไซต์ช้อปปิ้งเสื้อผ้าที่มีเสื้อ 3 สี (ดำ, น้ำตาล, ขาว) พร้อมระบบคำนวณราคาโปรโมชั่นพิเศษ

## คุณสมบัติ

- **สินค้า**: เสื้อ 3 สี (ดำ, น้ำตาล, ขาว)
- **ไซส์**: SS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL
- **ราคา**: 229 บาท (ไซส์ใหญ่ 2XL-5XL เพิ่ม 20 บาท)
- **โปรโมชั่น**: ซื้อ 3 ตัว ราคา 599 บาท
- **ระบบสั่งซื้อ**: ครบวงจรพร้อมการชำระเงินและติดตามออเดอร์
- **ระบบแอดมิน**: จัดการออเดอร์และอัปเดตสถานะ
- **Database**: MongoDB Atlas (ข้อมูลไม่หายเมื่อ server restart)

## การติดตั้ง

### Local Development

1. ติดตั้ง Node.js dependencies:
```bash
npm install
```

2. คัดลอกรูปภาพไปยังโฟลเดอร์ `public/images/`:
   - `black.png` - เสื้อสีดำ
   - `brown.png` - เสื้อสีน้ำตาล  
   - `white.png` - เสื้อสีขาว

3. รันเซิร์ฟเวอร์:
```bash
npm start
```

4. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

### Deploy บน Render

1. **สร้าง MongoDB Atlas Database:**
   - ไปที่ [mongodb.com/atlas](https://mongodb.com/atlas)
   - สร้าง account ฟรี
   - สร้าง cluster ใหม่
   - สร้าง database ชื่อ `plukrak`
   - สร้าง user และ password
   - ตั้งค่า Network Access (Allow access from anywhere: 0.0.0.0/0)

2. **Push โค้ดไปยัง GitHub repository**

3. **สร้าง Web Service ใหม่บน Render:**
   - เชื่อมต่อกับ GitHub repository
   - ตั้งค่าดังนี้:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: Node

4. **เพิ่ม Environment Variable บน Render:**
   - **MONGODB_URI**: `mongodb+srv://username:password@cluster.mongodb.net/plukrak`
   - แทนที่ `username`, `password`, `cluster` ด้วยข้อมูลจริงจาก MongoDB Atlas

5. **Deploy**

## โปรโมชั่น

- **ราคาปกติ**: 229 บาทต่อตัว
- **ไซส์ใหญ่**: 2XL, 3XL, 4XL, 5XL เพิ่ม 20 บาทต่อตัว
- **โปรโมชั่น 3 ตัว**: 599 บาท + ราคาเพิ่มสำหรับไซส์ใหญ่

### ตัวอย่างการคำนวณ

- S + M + L = 599 บาท
- S + 2XL + 2XL = 599 + (20×2) = 639 บาท
- M + M + M + M + M = 599 + (229×2) = 1,057 บาท

## เทคโนโลยีที่ใช้

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: MongoDB Atlas (Cloud Database)
- **File Storage**: Local file system (สำหรับสลิป)
- **Deployment**: Render

## โครงสร้างไฟล์

```
plukrak-shop/
├── server.js          # เซิร์ฟเวอร์ Node.js
├── package.json       # Dependencies และ scripts
├── render.yaml        # Render deployment config
├── .gitignore         # Git ignore rules
├── public/
│   ├── index.html     # หน้าเว็บหลัก
│   ├── purchase.html  # หน้าสั่งซื้อ
│   ├── track.html     # หน้าติดตามออเดอร์
│   ├── admin.html     # หน้าแอดมิน
│   ├── styles.css     # CSS styles
│   ├── script.js      # JavaScript หน้าหลัก
│   ├── purchase.js    # JavaScript หน้าสั่งซื้อ
│   ├── track.js       # JavaScript หน้าติดตาม
│   ├── admin.js       # JavaScript หน้าแอดมิน
│   └── images/        # รูปภาพสินค้า
├── orders/            # ข้อมูลออเดอร์ (JSON files - fallback)
│   └── slips/         # สลิปการชำระเงิน
└── README.md          # คู่มือการใช้งาน
```

## Database Schema

### Collection: orders
```javascript
{
  "_id": ObjectId("..."),
  "orderId": "PLK1750261255622",
  "customer": {
    "name": "ชื่อลูกค้า",
    "phone": "เบอร์โทรศัพท์"
  },
  "delivery": {
    "method": "delivery|pickup",
    "address": "ที่อยู่จัดส่ง",
    "pickupLocation": "สถานที่นัดรับ"
  },
  "items": [
    {
      "productId": 1,
      "name": "เสื้อสีดำ",
      "size": "M",
      "price": 229,
      "quantity": 1
    }
  ],
  "total": 659,
  "deliveryFee": 30,
  "grandTotal": 689,
  "status": "wait_slip|wait_ship|shipped",
  "orderDate": "2025-06-18T15:40:55.622Z",
  "createdAt": "2025-06-18T15:40:55.622Z",
  "updatedAt": "2025-06-18T15:40:55.622Z",
  "slip": "/orders/slips/PLK1750261255622.png",
  "tracking": "หมายเลข tracking (ถ้ามี)"
}
```

## API Endpoints

- `GET /` - หน้าเว็บหลัก
- `GET /health` - Health check endpoint
- `GET /api/products` - ดึงข้อมูลสินค้า
- `POST /api/calculate-price` - คำนวณราคา
- `POST /api/order` - สร้างออเดอร์ใหม่
- `GET /api/track` - ติดตามออเดอร์
- `GET /api/admin/orders` - ดึงออเดอร์ทั้งหมด (แอดมิน)
- `POST /api/admin/update-status` - อัปเดตสถานะออเดอร์ (แอดมิน)

## การใช้งาน

### สำหรับลูกค้า
1. เลือกสินค้าและเพิ่มลงตะกร้า
2. กรอกข้อมูลส่วนตัวและที่อยู่
3. เลือกวิธีรับของ (จัดส่ง/นัดรับ)
4. ชำระเงินผ่าน QR Code
5. อัปโหลดสลิปโอนเงิน
6. ติดตามสถานะออเดอร์

### สำหรับแอดมิน
- เข้าสู่ระบบด้วยรหัส: `123321`
- ดูรายการออเดอร์ทั้งหมด
- อัปเดตสถานะออเดอร์
- เพิ่มหมายเลข tracking

## ข้อดีของ MongoDB Atlas

- ✅ **ข้อมูลไม่หาย** เมื่อ Render restart
- ✅ **รองรับ concurrent users** (หลายคนใช้งานพร้อมกัน)
- ✅ **Query ข้อมูลได้เร็ว** (ค้นหาออเดอร์ตามเบอร์โทร)
- ✅ **Backup อัตโนมัติ**
- ✅ **ฟรี tier เพียงพอ** สำหรับร้านค้าเล็ก
- ✅ **Fallback system** - ถ้า MongoDB ไม่ทำงาน จะใช้ไฟล์ JSON แทน 