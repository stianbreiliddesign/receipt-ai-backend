import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";

const app = express();
const upload = multer();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("OK");
});

/**
 * 📸 ANALYSER BILDE DIREKTE
 */
app.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ingen bilde mottatt" });
    }

    const base64Image = req.file.buffer.toString("base64");

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Dette er et bilde av en norsk dagligvarekvittering. Finn varer, priser og kategoriser i: snus, alkohol, snacks_godteri, frossen_pizza, annet. Returner KUN gyldig JSON." },
            {
              type: "input_image",
              image_base64: base64Image,
            },
          ],
        },
      ],
    });

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
