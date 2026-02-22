export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('CONTACT_WEBHOOK_URL environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { firstName, lastName, practice, email, phone } = req.body;

    if (!firstName || !lastName || !practice || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const payload = {
      firstName,
      lastName,
      practice,
      email,
      phone,
      submittedAt: new Date().toISOString(),
    };

    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      console.error('Webhook responded with status:', webhookRes.status);
      return res.status(502).json({ error: 'Failed to forward submission' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
