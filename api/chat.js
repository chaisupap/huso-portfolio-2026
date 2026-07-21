// api/chat.js
export default async function handler(req, res) {
    // อนุญาตให้เรียกเฉพาะวิธี POST เท่านั้น
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // ดึง API Key จากระบบความปลอดภัยของ Vercel (คนทั่วไปจะมองไม่เห็นบรรทัดนี้)
    const apiKey = process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API Key is missing on server settings' });
    }

    const { contents, systemInstruction } = req.body;

    try {
        // ยิงคำขอไปยัง Google Gemini API จากฝั่ง Server
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, systemInstruction })
        });

        const data = await response.json();
        
        // ส่งคำตอบกลับไปที่หน้าเว็บ
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
