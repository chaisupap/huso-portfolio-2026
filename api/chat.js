export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY is missing in Vercel environment variables");
        return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        // ยิง request ไปหา Gemini API
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await geminiRes.json();

        // แสดงผลลัพธ์จาก Gemini ลงใน Vercel Log เพื่อให้เราคลิกดูได้
        console.log("Gemini Status:", geminiRes.status);
        console.log("Gemini Response Data:", JSON.stringify(data));

        // ส่ง Status Code และ ข้อมูลจริงกลับไปให้หน้าเว็บ
        return res.status(geminiRes.status).json(data);

    } catch (error) {
        console.error("Server Catch Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
