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
// สร้าง API Endpoint สำหรับรับข้อความแชต
app.post('/api/chat', async (req, res) => {
    try {
        // ✅ แก้ไข: ดึงทั้ง contents และ systemInstruction ที่ส่งมาจากหน้าบ้านมารอไว้
        const { contents, systemInstruction } = req.body; 
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing Gemini API Key on server setup' });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // ทำหน้าที่เป็น Proxy ยิงแทนหน้าบ้าน
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: contents,
                systemInstruction: systemInstruction // ✅ แก้ไข: ส่งระบบสั่งการตามไปด้วยเพื่อความเรียบร้อย
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Backend Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// ✅ อย่าลืมสั่งเปิดพอร์ตที่บรรทัดสุดท้ายของไฟล์ด้วยนะครับ (ถ้าในไฟล์จริงมีอยู่แล้วข้ามได้เลย)
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});