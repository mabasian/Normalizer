import express from "express";
import cors from "cors";
import multer from "multer";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

const THREAD_PATTERNS = [
  /^Von:/m,
  /^From:/m,
  /^Am .* schrieb/m,
  /^Anfang der weitergeleiteten Nachricht:/m,
];

function splitThread(text) {
  let idx = -1;

  THREAD_PATTERNS.forEach((p) => {
    const m = text.search(p);
    if (m !== -1 && (idx === -1 || m < idx)) idx = m;
  });

  if (idx !== -1) {
    return [text.slice(0, idx).trim(), text.slice(idx).trim()];
  }

  return [text.trim(), ""];
}

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function toEscapedString(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n");
}

async function extractAttachmentContent(file) {
  const name = (file.originalname || "").toLowerCase();

  if (file.mimetype.includes("text") || name.endsWith(".txt")) {
    return file.buffer.toString("utf8");
  }

  if (file.mimetype.includes("pdf") || name.endsWith(".pdf")) {
    try {
      const data = await pdfParse(file.buffer);
      const text = normalizeWhitespace(data?.text || "");

      if (!text) {
        return "[PDF has no embedded text - OCR required]";
      }

      return text;
    } catch (err) {
      return `[PDF text extraction failed: ${err.message}]`;
    }
  }

  return "[Binary file]";
}

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Normalizer backend running" });
});

app.post("/normalize", upload.array("files"), async (req, res) => {
  try {
    const {
      filename = "mail_raw.msg",
      from = "",
      sentAt = "",
      to = "",
      cc = "",
      subject = "",
      email = "",
      outputMode = "multiline",
    } = req.body;

    const normalizedEmail = normalizeWhitespace(email);
    const [content, thread] = splitThread(normalizedEmail);

    let output = `Filename: ${filename}
From: ${from}
SentAt: ${sentAt}
To: ${to}
Cc: ${cc}
Subject: ${subject}

Content:
${content}

Thread:
${thread}
`;

    const files = req.files || [];

    for (const file of files) {
      const extracted = await extractAttachmentContent(file);

      output += `

Attachment:
Filename: ${file.originalname}
Content:
${extracted}`;
    }

    if (outputMode === "escaped") {
      output = toEscapedString(output);
    }

    res.json({ normalized: output });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});