export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are an expert travel assistant for Holidater app. Help users find best flights, hotels and travel options. Give specific actionable advice with approximate prices, best booking sites, travel tips, visa info and seasonal recommendations. Be concise, friendly and helpful. Always suggest checking official booking sites for real-time prices. Use bullet points and short paragraphs to keep responses scannable. Keep replies under 250 words.',
        messages,
      }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.error?.message || 'Upstream API error' })
    }

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
