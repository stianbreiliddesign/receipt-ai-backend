import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Receipt AI backend is running 🚀");
});


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  const prompt = `
Dette er OCR-tekst fra en norsk dagligvarekvittering.

Finn varer og priser, og kategoriser i:
- snus
- alkohol
- snacks_godteri
- frossen_pizza
- annet

Returner KUN gyldig JSON.
Kvittering:
"""
${text}
"""
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  res.json(JSON.parse(completion.choices[0].message.content));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});


