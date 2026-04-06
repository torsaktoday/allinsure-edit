# วิธีการเปลี่ยนฐานข้อมูล

## ระบบปัจจุบัน
ระบบใช้ **Turso Database** (SQLite Cloud) ซึ่งเป็นฐานข้อมูล SQL ที่ใช้งานบนคลาวด์

## ขั้นตอนการเปลี่ยนฐานข้อมูน

### 1. สร้างฐานข้อมูลใหม่บน Turso
- ไปที่ https://turso.tech/
- สร้าง account หรือ login
- สร้างฐานข้อมูลใหม่
- คัดลอก **Database URL** และ **Auth Token**

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ในโฟลเดอร์ root:

```
TURSO_DATABASE_URL=libsql://your-database-name-your-org.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

### 3. ไฟล์ที่ต้องแก้ไข

#### `api/db.js` - ไฟล์เชื่อมต่อฐานข้อมูล
```javascript
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const dbConfig = {
  url: url || 'file:safeguard.db',  // ใช้ local file ถ้าไม่มี env vars
  authToken: authToken,
};
```

**ที่ต้องแก้:**
- `TURSO_DATABASE_URL` - เปลี่ยนเป็น URL ของฐานข้อมูลใหม่
- `TURSO_AUTH_TOKEN` - เปลี่ยนเป็น token ใหม่

#### `api/master.js` - ไฟล์ seed data
ไฟล์นี้มี `SEED_DATA` ที่จะสร้างข้อมูลเริ่มต้นอัตโนมัติ

**ที่ต้องแก้ (ถ้าต้องการ):**
- Companies (บริษัทประกัน)
- Car Makes (ยี่ห้อรถ)
- Car Models (รุ่นรถ)
- Knowledge Base (ข้อมูลช่วยเหลือ)
- Settings (ตั้งค่าระบบ)

### 4. ตัวอย่างการเปลี่ยนข้อมูล

#### เปลี่ยนบริษัทประกัน
ในไฟล์ `api/master.js` ค้นหา `SEED_DATA.companies`:

```javascript
companies: [
    { id: 'c1', name: 'วิริยะประกันภัย', logoUrl: '...', color: '#F59E0B' },
    { id: 'c2', name: 'กรุงเทพประกันภัย', logoUrl: '...', color: '#1E3A8A' },
    // เพิ่มบริษัทใหม่ที่นี่
]
```

#### เปลี่ยนยี่ห้อรถ
ในไฟล์ `api/master.js` ค้นหา `SEED_DATA.makes`:

```javascript
makes: [
    { id: 'm1', name: 'Toyota', logoUrl: '...' },
    { id: 'm2', name: 'Honda', logoUrl: '...' },
    // เพิ่มยี่ห้อใหม่ที่นี่
]
```

#### เปลี่ยนรุ่นรถ
ในไฟล์ `api/master.js` ค้นหา `SEED_DATA.models`:

```javascript
models: [
    { id: 'mo1', makeId: 'm1', name: 'Yaris', subModels: ['Entry', 'Sport'] },
    // เพิ่มรุ่นใหม่ที่นี่
]
```

### 5. ตัวอย่างการเปลี่ยนการเชื่อมต่อ

#### ถ้าต้องการใช้ฐานข้อมูลอื่น (เช่น PostgreSQL, MySQL)
ต้องแก้ไข `api/db.js` เพื่อใช้ library ที่เหมาะสม:

```javascript
// ตัวอย่าง: ใช้ PostgreSQL
import pg from 'pg';
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});
```

### 6. ตัวอย่างการเปลี่ยนตั้งค่าระบบ
ในไฟล์ `api/master.js` ค้นหา `SEED_DATA.settings`:

```javascript
settings: [
    { key: 'safeguard_ai_model', value: 'gemini-2.5-flash' },
    { key: 'theme_gradient', value: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' },
    // เพิ่มตั้งค่าใหม่ที่นี่
]
```

## ตารางฐานข้อมูล

### users
- id (TEXT PRIMARY KEY)
- username (TEXT)
- role (TEXT) - ADMIN, AGENT
- name (TEXT)
- totalSales (INTEGER)
- status (TEXT) - ACTIVE, INACTIVE

### companies
- id (TEXT PRIMARY KEY)
- name (TEXT)
- logoUrl (TEXT)
- color (TEXT)

### car_makes
- id (TEXT PRIMARY KEY)
- name (TEXT)
- logoUrl (TEXT)

### car_models
- id (TEXT PRIMARY KEY)
- makeId (TEXT FOREIGN KEY)
- name (TEXT)
- subModels (TEXT JSON)

### knowledge_base
- id (TEXT PRIMARY KEY)
- question (TEXT)
- answer (TEXT)
- category (TEXT)

### system_settings
- key (TEXT PRIMARY KEY)
- value (TEXT)

### insurance_plans
- id (TEXT PRIMARY KEY)
- companyId (TEXT FOREIGN KEY)
- planName (TEXT)
- price (INTEGER)
- sumInsured (INTEGER)
- details (TEXT JSON)
- isHotDeal (BOOLEAN)

### chat_logs
- id (TEXT PRIMARY KEY)
- sessionId (TEXT)
- role (TEXT)
- message (TEXT)
- timestamp (TEXT)
- ip (TEXT)
- userAgent (TEXT)
- deviceInfo (TEXT)
- lat (REAL)
- lng (REAL)
- city (TEXT)
- region (TEXT)
- isp (TEXT)
- referrer (TEXT)
- metaData (TEXT JSON)

## การทดสอบการเชื่อมต่อ

1. ตรวจสอบ environment variables:
```bash
echo $TURSO_DATABASE_URL
echo $TURSO_AUTH_TOKEN
```

2. รัน development server:
```bash
npm run dev
```

3. ตรวจสอบ console สำหรับข้อความ "Seeding complete" ซึ่งหมายความว่าฐานข้อมูลถูกสร้างและเติมข้อมูลสำเร็จ
