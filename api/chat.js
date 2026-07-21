export default async function handler(req, res) {
    // กำหนด CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // เรียกใช้ API Key ของ KKU ที่ตั้งไว้ใน Vercel
    const apiKey = process.env.KKU_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า KKU_API_KEY ใน Vercel' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        let messages = [];

        // 1. แปลง System Instruction
        if (body.systemInstruction?.parts?.[0]?.text) {
            messages.push({ role: 'system', content: body.systemInstruction.parts[0].text });
        } else if (typeof body.systemInstruction === 'string') {
            messages.push({ role: 'system', content: body.systemInstruction });
        }

        // 2. แปลง ประวัติการคุย (Contents) ให้เข้ากับฟอร์แมตมาตรฐาน
        if (Array.isArray(body.contents)) {
            body.contents.forEach(item => {
                const role = item.role === 'model' ? 'assistant' : 'user';
                const text = item.parts?.[0]?.text || item.content || '';
                if (text) {
                    messages.push({ role, content: text });
                }
            });
        } else if (body.messages) {
            messages = body.messages;
        }

        // 3. ยิง Request ไปที่ KKU AI Gateway (ต่อท้ายด้วย /chat/completions)
        const kkuRes = await fetch('https://gen.ai.kku.ac.th/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                // ใส่ชื่อโมเดลที่ KKU AI เปิดให้ใช้งาน (เช่น 'gpt-4o-mini', 'gemini-1.5-flash' หรือ 'typhoon-v1.5x-70b-instruct')
                model: process.env.KKU_MODEL || 'gemini-1.5-flash',
                messages: messages
            })
        });

        const kkuData = await kkuRes.json();

        if (!kkuRes.ok) {
            console.error("KKU AI Error:", kkuData);
            return res.status(kkuRes.status).json({ error: kkuData.error?.message || 'KKU AI API Error' });
        }

        const replyText = kkuData.choices?.[0]?.message?.content || '';

        // 4. แปลงคำตอบกลับไปเป็นโครงสร้างที่ index.html อ่านได้
        const formattedResponse = {
            candidates: [
                {
                    content: {
                        parts: [
                            { text: replyText }
                        ]
                    }
                }
            ]
        };

        return res.status(200).json(formattedResponse);

    } catch (error) {
        console.error("Server Catch Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
