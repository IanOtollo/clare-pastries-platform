const url = "https://fduoacyykjsqpmraajua.supabase.co/rest/v1/CustomOrder";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdW9hY3l5a2pzcXBtcmFhanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzYwNjksImV4cCI6MjA5MTM1MjA2OX0.EiFQjivDLfjVqiSrMFNAUpI8v5YblUNydlj1bJDQL1Y";

const payload = {
  id: "277e9bb4-b635-430c-ab23-86105db05051",
  fullName: "Test User",
  phone: "0700000000",
  email: null,
  occasion: "Birthday",
  description: "Test description",
  flavors: null,
  servings: null,
  preferredDate: null,
  fulfillment: "delivery",
  deliveryArea: null,
  budgetRange: null,
  notes: null,
  status: 'NEW'
};

fetch(url, {
  method: "POST",
  headers: {
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  },
  body: JSON.stringify(payload)
}).then(res => res.json()).then(data => {
  console.log("Response:", data);
}).catch(console.error);
