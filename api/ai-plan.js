export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'pending') {
    return res.status(503).json({ error: 'AI planner is not configured yet.' })
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    )

    const data = await upstream.json()
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.error?.message || 'Gemini error' })

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    // strip markdown code fences if present
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    res.status(200).json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
