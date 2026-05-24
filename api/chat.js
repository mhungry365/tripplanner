export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'pending') {
    return res.status(503).json({ error: 'AI assistant is not configured yet. Please try again later.' })
  }

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  try {
    const fullContents = [
      { role: 'user',  parts: [{ text: 'You are an expert travel assistant for Holidater app. Help users find best flights, hotels and travel options. Give specific actionable advice with approximate prices, best booking sites, travel tips, visa info and seasonal recommendations. Be concise, friendly and helpful.' }] },
      { role: 'model', parts: [{ text: 'I am your Holidater travel assistant! I can help you find the best flights, hotels, travel tips, visa information and more. What would you like to know?' }] },
      ...contents,
    ]

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: fullContents }),
      }
    )

    const data = await upstream.json()

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.error?.message || 'Gemini API error' })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Sorry, I could not get a response. Please try again.'

    res.status(200).json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
