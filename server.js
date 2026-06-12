import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// ดึงตัวแปรคีย์ความลับจากไฟล์ .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// บรรทัดสั่งพ่นตรวจสอบสถานะคีย์ตอนเปิดเซิร์ฟเวอร์
console.log("🔑 สแกนพบรหัสคีย์ในระบบ:", GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : "ว่างเปล่า");

// เรียกใช้งานเครื่องมือสำเร็จรูปของ Google มารับมือกับตัวคีย์
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // เรียกใช้งานโมเดลเวอร์ชันล่าสุด
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: userMessage,
        });

        // ส่งคำตอบกลับไปที่หน้าเว็บ (Frontend)
        res.json({ reply: response.text });

    } catch (error) {
        console.error('❌ ตรวจพบข้อผิดพลาดฝั่ง Google SDK:', error);
        res.status(500).json({ reply: 'ขออภัยครับ ตัวประมวลผล SDK เกิดข้อผิดพลาดภายใน' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 เซิร์ฟเวอร์หลังบ้านระบบ SDK พร้อมทำงานแล้วที่ Port ${PORT}`));