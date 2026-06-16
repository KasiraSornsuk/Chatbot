const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai'); // ใช้ไลบรารีอย่างเป็นทางการของ Google
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// เรียกใช้งาน API Key จากหน้าเว็บ Render
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        const { contents, systemInstruction } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing Gemini API Key on Render setting' });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                // ✅ ใส่ค่าข้อความที่ส่งมาจากหน้าบ้านลงไปตรงๆ ได้เลย
                systemInstruction: systemInstruction 
            }
        });

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