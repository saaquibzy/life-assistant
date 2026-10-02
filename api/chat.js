// Vercel serverless function: the assistant's brain (Claude API).
// Env vars (Vercel > Project > Settings > Environment Variables): ANTHROPIC_API_KEY, APP_PASSCODE
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ reply: 'POST only' });
  if (!process.env.APP_PASSCODE || req.headers['x-pass'] !== process.env.APP_PASSCODE)
    return res.status(401).json({ reply: 'Wrong or missing passcode.' });
  const { messages = [], context = '' } = req.body || {};
  const system = `You are the user's personal assistant inside their life-routine app. They are a final-year engineering student in Bengaluru with these goals: clear backlogs (BME 502/503/602), find internships/jobs, prepare a Germany Masters (IELTS, German, DAAD, uni-assist), learn Robotics, Agentic/GenAI and Cybersecurity, keep up skincare, sleep 6 hrs. Be brief, concrete and kind. Use their live data below to suggest what to do next, re-plan missed blocks, and flag deadlines. Never invent data.\n\nLIVE DATA:\n${context}`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 600, system, messages: messages.slice(-12) })
    });
    const d = await r.json();
    res.status(r.ok ? 200 : r.status).json({ reply: (d.content || []).map(c => c.text || '').join('') || (d.error && d.error.message) || 'No reply' });
  } catch (e) { res.status(500).json({ reply: 'Server error: ' + e.message }); }
};
