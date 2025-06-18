# Plukrak - เว็บไซต์ช้อปปิ้งเสื้อผ้า

เว็บไซต์ช้อปปิ้งเสื้อผ้าที่มีเสื้อ 3 สี (ดำ, น้ำตาล, ขาว) พร้อมระบบคำนวณราคาโปรโมชั่นพิเศษ

## คุณสมบัติ

- **สินค้า**: เสื้อ 3 สี (ดำ, น้ำตาล, ขาว)
- **ไซส์**: SS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL
- **ราคา**: 229 บาท (ไซส์ใหญ่ 2XL-5XL เพิ่ม 20 บาท)
- **โปรโมชั่น**: ซื้อ 3 ตัว ราคา 599 บาท
- **ระบบสั่งซื้อ**: ครบวงจรพร้อมการชำระเงินและติดตามออเดอร์
- **ระบบแอดมิน**: จัดการออเดอร์และอัปเดตสถานะ

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

1. Push โค้ดไปยัง GitHub repository
2. สร้าง Web Service ใหม่บน Render
3. เชื่อมต่อกับ GitHub repository
4. ตั้งค่าดังนี้:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Deploy

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
- **Database**: ไฟล์ JSON (ไม่ใช้ database จริง)
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
├── orders/            # ข้อมูลออเดอร์ (JSON files)
│   └── slips/         # สลิปการชำระเงิน
└── README.md          # คู่มือการใช้งาน
```

## API Endpoints

- `GET /` - หน้าเว็บหลัก
- `GET /api/products` - ดึงข้อมูลสินค้า
- `POST /api/calculate-price` - คำนวณราคา
- `POST /api/order` - สร้างออเดอร์ใหม่
- `GET /api/track` - ติดตามออเดอร์
- `GET /api/admin/orders` - ดึงออเดอร์ทั้งหมด (แอดมิน)
- `POST /api/admin/update-status` - อัปเดตสถานะออเดอร์ (แอดมิน)
- `GET /health` - Health check endpoint

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