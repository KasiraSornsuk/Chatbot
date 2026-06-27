const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai'); // ใช้ไลบรารีอย่างเป็นทางการของ Google
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// เรียกใช้งาน API Key จากหน้าเว็บ Render
console.log('DEBUG - มี GEMINI_API_KEY ไหม:', !!process.env.GEMINI_API_KEY);
console.log('DEBUG - ความยาวของ Key:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        const { contents, systemInstruction } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing Gemini API Key on Render setting' });
        }

        // ✅ ฟังก์ชันลองเรียกใหม่อัตโนมัติ ถ้า Gemini ตอบ 503 (model overload ชั่วคราว)
        async function callGeminiWithRetry(retries = 3, delayMs = 1500) {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    return await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: contents,
                        config: {
                            // ✅ ใส่ค่าข้อความที่ส่งมาจากหน้าบ้านลงไปตรงๆ ได้เลย
                            systemInstruction: systemInstruction
                        }
                    });
                } catch (err) {
                    const isOverloaded = err.message && (err.message.includes('503') || err.message.includes('UNAVAILABLE'));
                    if (isOverloaded && attempt < retries) {
                        console.warn(`Gemini รุ่นนี้ไม่พร้อมใช้งานชั่วคราว กำลังลองใหม่ครั้งที่ ${attempt + 1}...`);
                        await new Promise(r => setTimeout(r, delayMs * attempt)); // เพิ่มเวลารอขึ้นทีละรอบ
                        continue;
                    }
                    throw err;
                }
            }
        }

        const response = await callGeminiWithRetry();

        // ✅ ส่งกลับไปเป็นก้อนวัตถุที่มีคีย์ชื่อ text เสมอ หน้าบ้านจะได้แกะด้วย data.text ได้แม่นยำ
        res.json({ text: response.text });

    } catch (error) {
        console.error('Backend Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
