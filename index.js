import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ingen bilde mottatt" });
    }

    const imageBuffer = fs.readFileSync(req.file.path);

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Dette er et bilde av en norsk dagligvarekvittering.

Oppgave:
- Finn varer og priser
- Kategoriser hver vare i:
  - snus
  - alkohol
  - snacks_godteri
  - frossen_pizza
  - annet

Svar KUN med gyldig JSON i dette formatet:

{
  "butikk": string,
  "dato": string,
  "varer": [
    {
      "navn": string,
      "pris": number,
      "kategori": string
    }
  ],
  "total": number
}
`
            },
            {
              type: "input_image",
              image_base64: imageBuffer.toString("base64"),
            }
          ],
        }
      ],
    });

    // Rydd opp midlertidig fil
    fs.unlinkSync(req.file.path);

    const text = response.output_text;

    res.json(JSON.parse(text));
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Klarte ikke analysere kvitteringen",
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});
