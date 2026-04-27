export default async function handler(req, res) {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, customerName, customerPhone, itemsList, totalKes, fulfillment } = req.body;

  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_API_KEY;

  if (!phone || !apikey) {
    return res.status(500).json({ error: 'CallMeBot credentials not configured' });
  }

  const message = encodeURIComponent(
    `🧁 New Order!\nID: ${String(orderId).slice(0, 8)}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nItems: ${itemsList}\nTotal: KES ${totalKes}\nType: ${fulfillment}`
  );

  try {
    const response = await fetch(
      `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${message}&apikey=${apikey}`
    );
    const text = await response.text();
    return res.status(200).json({ success: true, response: text });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
