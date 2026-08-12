require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 10000;

app.post("/api/generate", async (req, res) => {
  try {
    const { type, topic, tone } = req.body || {};
    if (!topic || !type) {
      return res.status(400).json({ error: "Please provide a content type and topic." });
    }

    if (!process.env.AI_API_KEY) {
      return res.status(503).json({
        error: "AI provider is not connected yet. Add AI_API_KEY in Render Environment Variables."
      });
    }

    const prompt = `Create a high-quality ${type} for the topic: "${topic}".
Tone: ${tone || "powerful, warm and engaging"}.
Make it original, useful and ready to post. Do not claim guaranteed income or guaranteed results.`;

    const response = await fetch(process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Carisia AI Content Studio, a helpful content-writing assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: data?.error?.message || "AI provider request failed." });
    }

    const text = data?.choices?.[0]?.message?.content || "No content was returned.";
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong while generating content." });
  }
});

app.post("/api/paystack/initialize", async (req, res) => {
  try {
    const { email, amount, plan } = req.body || {};
    if (!email || !amount || !plan) {
      return res.status(400).json({ error: "Email, amount and plan are required." });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({
        error: "Paystack is not connected yet. Add PAYSTACK_SECRET_KEY in Render Environment Variables."
      });
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount) * 100),
        callback_url: process.env.PAYSTACK_CALLBACK_URL,
        metadata: { plan }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(502).json({ error: data?.message || "Paystack initialization failed." });
    }

    res.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
  } catch (error) {
    res.status(500).json({ error: "Unable to start payment." });
  }
});

app.get("/payment/callback", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "payment.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Carisia AI Content Studio running on port ${PORT}`);
});
