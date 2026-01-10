import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check (viktig for Render)
app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ingen bilde mottatt" });
    }

    const imageBase64 = req.file.buffer.toString("base64");

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Dette er et bilde av en norsk dagligvarekvittering. Finn varer, priser og kategoriser i: snus, alkohol, snacks/godteri, frossen pizza, annet. Returner KUN gyldig JSON." },
            {
              type: "input_image",
              image_base64: imageBase64,
            },
          ],
        },
      ],
    });

    const outputText =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text;

    res.json(JSON.parse(outputText));
  } catch (err) {
    console.error("ANALYSE-FEIL:", err);
    res.status(500).json({
      error: "Klarte ikke analysere kvitteringen",
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});
