import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Mangler bilde" });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Dette er et bilde av en norsk dagligvarekvittering.

1. Finn alle varer og priser
2. Kategoriser i:
- snus
- alkohol
- snacks_godteri
- frossen_pizza
- annet

Returner KUN gyldig JSON med format:

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
`
            },
            {
              type: "input_image",
              image_base64: imageBase64
            }
          ]
        }
      ]
    });

    const text = response.output_text;
    res.json(JSON.parse(text));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Klarte ikke analysere kvitteringen" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server kjører på port", PORT);
});
