const $ = (id) => document.getElementById(id);

$("generate").addEventListener("click", async () => {
  const topic = $("topic").value.trim();
  const type = $("type").value;
  const tone = $("tone").value;
  if (!topic) {
    $("status").textContent = "Please enter a topic first.";
    return;
  }
  $("status").textContent = "Generating...";
  $("result").value = "";
  try {
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ type, topic, tone })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Generation failed.");
    $("result").value = data.text;
    $("status").textContent = "Done.";
  } catch (e) {
    $("status").textContent = e.message;
  }
});

$("copy").addEventListener("click", async () => {
  const text = $("result").value;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  $("status").textContent = "Copied.";
});

document.querySelectorAll(".plan").forEach(btn => {
  btn.addEventListener("click", async () => {
    const email = prompt("Enter the email address for your Paystack receipt:");
    if (!email) return;
    try {
      const r = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          email,
          amount: Number(btn.dataset.amount),
          plan: btn.dataset.plan
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Payment could not start.");
      window.location.href = data.authorization_url;
    } catch (e) {
      alert(e.message);
    }
  });
});
