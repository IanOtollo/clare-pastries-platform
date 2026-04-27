const phone = "254700399641";
const apikey = "8027903";
const message = encodeURIComponent("Test message from server!");

fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${message}&apikey=${apikey}`)
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
