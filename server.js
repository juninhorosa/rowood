import { 
  default as makeWASocket, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion 
} from "@whiskeysockets/baileys";

import mysql from "mysql2/promise";
import express from "express";

/* ===============================================
   1. BANCO DE DADOS
================================================ */
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

/* ===============================================
   2. INICIAR BOT WHATSAPP
================================================ */
async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const { version } = await fetchLatestBaileysVersion();
  console.log("📌 Versão WA:", version);

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  /* Receber mensagens */
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const texto = msg.message.conversation || "";
    const from = msg.key.remoteJid;

    console.log("📩 Msg:", texto);

    if (texto.toLowerCase() === "oi") {
      await sock.sendMessage(from, { text: "Olá! 👋 Bot Rowood ativo." });
    }
  });

  return sock;
}

const sock = await startBot();

/* ===============================================
   3. API HTTP
================================================ */
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BOT Rowood WhatsApp rodando ✔");
});

app.post("/send-message", async (req, res) => {
  try {
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem)
      return res.json({ erro: "Faltando parâmetros" });

    await sock.sendMessage(numero + "@s.whatsapp.net", {
      text: mensagem
    });

    res.json({ enviado: true });

  } catch (e) {
    res.json({ erro: e.message });
  }
});

/* ===============================================
   4. INICIAR SERVIDOR
================================================ */
app.listen(3000, () => {
  console.log("🌐 API online na porta 3000");
});
