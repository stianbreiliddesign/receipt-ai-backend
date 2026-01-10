import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check (VIKTIG for Render)
app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ingen bilde mottatt" });
    }

    const base64Image = req.file.buffer.toString("base64");

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Dette er et bilde av en norsk dagligvarekvittering.

Oppgaver:
1. Finn alle varer med pris
2. Kategoriser i:
   - snus
   - alkohol
   - snacks_godteri
   - frossen_pizza
   - annet
3. Summer total per kategori

Returner KUN gyldig JSON i dette formatet:
{
  "items": [
    { "name": "...", "price": 0, "category": "..." }
  ],
  "totals": {
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
              image_url: `data:image/jpeg;base64,${base64Image}`
            }
          ]
        }
      ]
    });

    res.json(response.output_parsed);
  } catch (error) {
    console.error("ANALYZE ERROR:", error);
    res.status(500).json({ error: "Klarte ikke analysere kvitteringen" });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log("Server kjører på port", port);
});
