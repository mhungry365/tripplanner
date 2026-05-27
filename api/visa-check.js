export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { passport_country, destination, destination_country } = req.body
  if (!passport_country || !destination) return res.status(400).json({ error: 'Missing fields' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'pending') {
    return res.status(503).json({ error: 'AI planner is not configured yet.' })
  }

  const prompt = `You are a visa requirements expert. A person holding a ${passport_country} passport wants to travel to ${destination}, ${destination_country || ''}.
Search your knowledge of official embassy websites, VFS Global, BLS International, and IATA Timatic to provide accurate visa requirements.
Respond ONLY with a JSON object in this exact format, no markdown, no explanation:
{
"visa_required": true or false,
"visa_type": "e-Visa" or "Visa on Arrival" or "No Visa Required" or "Embassy Visa" or "ETA",
"cost_usd": number or null,
"processing_days": number or null,
"max_stay_days": number or null,
"apply_url": "official application URL or null",
"embassy_url": "embassy website URL or null",
"notes": "any important notes, conditions, or warnings",
"source": "name of the official source used"
}`

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
        }),
      }
    )

    const data = await upstream.json()
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.error?.message || 'Gemini error' })

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    // strip markdown code fences if present
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    const result = JSON.parse(text)
    res.status(200).json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch visa info', details: err.message })
  }
}
