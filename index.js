import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔍 Health check (VIKTIG)
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 20) {
      return res.json({ error: "For lite tekst fra kvittering" });
    }

    const prompt = `
Du er en norsk kvitterings-analytiker.

OCR-tekst fra dagligvarekvittering:
"""
${text}
"""

Finn varer og priser.
Kategoriser i:
- snus
- alkohol
- snacks_godteri
- frossen_pizza
- annet

Returner KUN gyldig JSON i dette formatet:

{
  "varer": [
    { "navn": "...", "pris": 0, "kategori": "..." }
  ],
  "summer": {
    "snus": 0,
    "alkohol": 0,
    "snacks_godteri": 0,
    "frossen_pizza": 0,
    "annet": 0
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content;

    // 🔒 Trygg parsing
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse feilet:", raw);
      return res.json({
        error: "AI returnerte ugyldig format",
        raw: raw,
      });
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Klarte ikke analysere kvitteringen",
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server kjører på port", PORT);
});
