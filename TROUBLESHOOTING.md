# Troubleshooting - ปัญหาการเชื่อมต่อฐานข้อมูล

## ปัญหา: "Unknown error" เมื่อ Sync Structure

### ขั้นตอนการตรวจสอบ:

#### 1. ตรวจสอบ Environment Variables ใน Vercel
1. ไปที่ https://vercel.com/
2. เลือก Project: `allinsure-edit`
3. ไปที่ **Settings** > **Environment Variables**
4. ตรวจสอบว่ามี:
   - `TURSO_DATABASE_URL` ✓
   - `TURSO_AUTH_TOKEN` ✓

**ถ้าไม่มี:**
- ไปที่ Turso Dashboard (https://turso.tech/)
- คัดลอก Database URL และ Auth Token
- เพิ่มเข้า Vercel Environment Variables

#### 2. ตรวจสอบการเชื่อมต่อ
เปิด URL นี้ในเบราว์เซอร์:
```
https://allinsure-edit.vercel.app/api/health
```

**ผลลัพธ์ที่ถูกต้อง:**
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": {
    "TURSO_DATABASE_URL": "✓ SET",
    "TURSO_AUTH_TOKEN": "✓ SET"
  }
}
```

**ผลลัพธ์ที่ผิด:**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "...",
  "environment": {
    "TURSO_DATABASE_URL": "✗ NOT SET",
    "TURSO_AUTH_TOKEN": "✗ NOT SET"
  }
}
```

#### 3. ตรวจสอบ Vercel Logs
1. ไปที่ Vercel Dashboard
2. เลือก Project: `allinsure-edit`
3. ไปที่ **Deployments**
4. คลิก deployment ล่าสุด
5. ดู **Logs** ส่วน "Function Logs"
6. ค้นหา "DATABASE CONFIGURATION" เพื่อดูว่า environment variables ถูกอ่านหรือไม่

#### 4. ตรวจสอบ Turso Database
1. ไปที่ https://turso.tech/
2. ตรวจสอบว่า Database ยังมีอยู่
3. ตรวจสอบว่า Auth Token ยังใช้ได้

### วิธีแก้ไข:

#### ถ้า Environment Variables ไม่ SET:
1. ไปที่ Vercel Settings > Environment Variables
2. เพิ่ม `TURSO_DATABASE_URL` และ `TURSO_AUTH_TOKEN`
3. **Redeploy** project (ไปที่ Deployments > คลิก "Redeploy")

#### ถ้า Database URL ผิด:
1. ไปที่ Turso Dashboard
2. คัดลอก URL ที่ถูกต้อง
3. อัปเดต `TURSO_DATABASE_URL` ใน Vercel
4. Redeploy

#### ถ้า Auth Token หมดอายุ:
1. ไปที่ Turso Dashboard > Database > Tokens
2. สร้าง Token ใหม่
3. อัปเดต `TURSO_AUTH_TOKEN` ใน Vercel
4. Redeploy

### ขั้นตอนการ Sync หลังจากแก้ไข:

1. รอให้ Vercel redeploy เสร็จ (ประมาณ 1-2 นาที)
2. ตรวจสอบ `/api/health` ว่า connected หรือไม่
3. ไปที่ระบบแอดมิน
4. คลิก **"Sync Structure"**
5. ควรจะสำเร็จแล้ว ✓

### ถ้ายังไม่ได้:

1. ลองคลิก **"Factory Reset"** แทน (จะลบข้อมูลเก่า)
2. ถ้ายังไม่ได้ ให้ตรวจสอบ Vercel Logs อีกครั้ง

---

## ไฟล์ที่เกี่ยวข้อง:

- `api/db.js` - เชื่อมต่อฐานข้อมูล (มี log สำหรับ debugging)
- `api/health.js` - ตรวจสอบสถานะการเชื่อมต่อ
- `api/setup.js` - Sync Structure / Factory Reset
