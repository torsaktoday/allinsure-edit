# Quick Start - เปลี่ยนฐานข้อมูล

## สรุปสั้นๆ

ระบบใช้ **Turso Database** (SQLite Cloud) ตอนนี้

### ขั้นตอนที่ 1: สร้างฐานข้อมูลใหม่
1. ไปที่ https://turso.tech/
2. สร้าง account และ login
3. สร้างฐานข้อมูลใหม่
4. คัดลอก **Database URL** และ **Auth Token**

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ในโฟลเดอร์ root:

```
TURSO_DATABASE_URL=libsql://your-database-name-your-org.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

### ขั้นตอนที่ 3: เปลี่ยนข้อมูลเริ่มต้น (ถ้าต้องการ)
แก้ไขไฟล์ `api/master.js` ในส่วน `SEED_DATA`:

- **Companies** - บริษัทประกัน
- **Makes** - ยี่ห้อรถ
- **Models** - รุ่นรถ
- **Knowledge Base** - ข้อมูลช่วยเหลือ
- **Settings** - ตั้งค่าระบบ

### ขั้นตอนที่ 4: รัน Development Server
```bash
npm install
npm run dev
```

ระบบจะสร้างตารางและเติมข้อมูลอัตโนมัติ

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | ที่อยู่ | ใช้สำหรับ |
|------|--------|---------|
| `api/db.js` | `/api/db.js` | เชื่อมต่อฐานข้อมูล |
| `api/master.js` | `/api/master.js` | ข้อมูลเริ่มต้น (seed data) |
| `.env.local` | `/` | ตั้งค่า environment variables |
| `DATABASE_SETUP.md` | `/` | เอกสารรายละเอียด |

---

## ตัวอย่างการแก้ไข

### เปลี่ยนบริษัทประกัน
ในไฟล์ `api/master.js`:

```javascript
companies: [
    { id: 'c1', name: 'บริษัทใหม่', logoUrl: 'https://...', color: '#FF0000' },
    // เพิ่มเติม...
]
```

### เปลี่ยนยี่ห้อรถ
ในไฟล์ `api/master.js`:

```javascript
makes: [
    { id: 'm1', name: 'Toyota', logoUrl: 'https://...' },
    { id: 'm2', name: 'Honda', logoUrl: 'https://...' },
    // เพิ่มเติม...
]
```

### เปลี่ยนรุ่นรถ
ในไฟล์ `api/master.js`:

```javascript
models: [
    { id: 'mo1', makeId: 'm1', name: 'Yaris', subModels: ['Entry', 'Sport'] },
    // เพิ่มเติม...
]
```

---

## ปัญหาทั่วไป

### ❌ "Cannot connect to database"
- ตรวจสอบ `TURSO_DATABASE_URL` และ `TURSO_AUTH_TOKEN` ใน `.env.local`
- ตรวจสอบว่า token ยังใช้ได้

### ❌ "Table does not exist"
- ระบบจะสร้างตารางอัตโนมัติ
- ตรวจสอบ console สำหรับข้อความ error

### ❌ "Seeding failed"
- ลบไฟล์ `safeguard.db` (ถ้ามี)
- รีสตาร์ท development server

---

## ต้องการข้อมูลเพิ่มเติม?
ดูไฟล์ `DATABASE_SETUP.md` สำหรับรายละเอียดทั้งหมด
