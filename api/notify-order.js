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

  const { isCustomOrder, orderId, customerName, customerPhone, itemsList, totalKes, fulfillment, occasion, description, budget } = req.body;

  const phone = process.env.VITE_CALLMEBOT_PHONE;
  const apikey = process.env.VITE_CALLMEBOT_API_KEY;

  if (!phone || !apikey) {
    return res.status(500).json({ error: 'CallMeBot credentials not configured' });
  }

  let rawMessage = '';
  if (isCustomOrder) {
    rawMessage = `🎨 Custom Order!\nID: ${String(orderId).slice(0, 8)}\nFrom: ${customerName}\nPhone: ${customerPhone}\nOccasion: ${occasion}\nDetails: ${description}\nBudget: ${budget || 'N/A'}\nType: ${fulfillment}`;
  } else {
    rawMessage = `🧁 New Order!\nID: ${String(orderId).slice(0, 8)}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nItems: ${itemsList}\nTotal: KES ${totalKes}\nType: ${fulfillment}`;
  }

  const message = encodeURIComponent(rawMessage);

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
