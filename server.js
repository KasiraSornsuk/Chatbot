// นำเข้าโมดูลที่ต้องใช้งาน
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // โหลดค่าจากไฟล์ .env

const app = express();
const PORT = process.env.PORT || 3000;

// อนุญาตให้ Frontend ข้ามโดเมนมาดึงข้อมูลได้ และเปิดใช้งานระบบอ่าน JSON
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// สร้าง API Endpoint สำหรับรับข้อความแชต
app.post('/api/chat', async (req, res) => {
    try {
        const { contents } = req.body; // รับประวัติการคุยส่งมาจาก Frontend
        const apiKey = process.env.GEMINI_API_KEY;

        // ถ้ายิงมาแล้วไม่มี Key ในระบบหลังบ้านให้แจ้งเตือนกลับไป
        if (!apiKey) {
            return res.status(500).json({ error: 'Missing Gemini API Key on server setup' });
        }

        
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // ทำหน้าที่เป็น Proxy ยิงแทนหน้าบ้าน
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: contents })
        });

        if (!response.ok) {
            throw new Error(`Gemini API responded with status ${response.status}`);
        }

        const data = await response.json();
        
        // ส่งข้อมูลที่ได้จาก Gemini กลับไปให้ Frontend (หน้าบ้าน)
        res.json(data);

    } catch (error) {
        console.error('Backend Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// เปิด Server ให้รอรับ Request
app.listen(PORT, () => {
    console.log(`🚀 Robot AI Backend is running on http://localhost:${PORT}`);
});