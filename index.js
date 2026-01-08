import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔍 Health check (viktig!)
app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length < 10) {
      return res.status(400).json({ error: "Ingen tekst mottatt" });
    }

    const prompt = `
Du er en kvitterings-analytiker.

Dette er OCR-tekst fra en norsk dagligvarekvittering.

Oppgave:
1. Finn alle produkter
2. Knytt riktig pris til hvert produkt hvis mulig
3. Kategoriser hvert produkt i ÉN av:
   - snus
   - alkohol
   - snacks_godteri
   - frossen_pizza
   - annet

Returner KUN gyldig JSON på dette formatet:

{
  "items": [
    {
      "name": "COOP NACHOS CHIPS",
      "price": 16.50,
      "category": "snacks_godteri"
    }
  ],
  "totals": {
    "snacks_godteri": 16.50,
    "alkohol": 0,
    "snus": 0,
    "frossen_pizza": 0,
    "annet": 60.50
  }
}

OCR-tekst:
"""
${text}
"""
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content;
    console.log("AI RAW RESPONSE:\n", raw);

    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    console.error("ANALYZE ERROR:", err.message);
    res.status(500).json({
      error: "Klarte ikke analysere kvitteringen",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});
