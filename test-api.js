fetch("https://clarepastries-pearl.vercel.app/api/notify-order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId: "test-from-api",
    customerName: "Test",
    customerPhone: "Test",
    itemsList: "Test",
    totalKes: 100,
    fulfillment: "Test"
  })
}).then(res => res.text()).then(console.log).catch(console.error);
