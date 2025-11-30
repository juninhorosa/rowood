import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
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
   2. BOT WHATSAPP
================================================ */
async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const { version } = await fetchLatestBaileysVersion();
  console.log("📌 Versão WA:", version);

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    syncFullHistory: false
  });

  // salvar credenciais
  sock.ev.on("creds.update", saveCreds);

  // reconexão automática
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const motivo = lastDisconnect?.error?.output?.statusCode;

      // 403 == sessão expirada, precisa escanear QR novamente
      if (motivo !== DisconnectReason.loggedOut) {
        console.log("♻️ Reconectando...");
        startBot();
      } else {
        console.log("🔴 Sessão deslogada. Escaneie o QR novamente.");
      }
    }

    if (connection === "open") {
      console.log("🟢 Bot conectado ao WhatsApp!");
    }
  });

  // mensagens recebidas
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const from = msg.key.remoteJid;

    console.log("📩 Mensagem:", texto);

    if (texto.toLowerCase() === "oi") {
      await sock.sendMessage(from, { text: "Olá! 👋 Bot Rowood ativo." });
    }
  });

  return sock;
}

const sock = await startBot();

/* ===============================================
   3. API HTTP para PHP enviar notificações
================================================ */
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bot Rowood online ✔");
});

// endpoint que o PHP usa
app.post("/send-message", async (req, res) => {
  try {
    const { numero, mensagem } = req.body;

    await sock.sendMessage(numero + "@s.whatsapp.net", {
      text: mensagem
    });

    res.json({ enviado: true });

  } catch (e) {
    console.error("Erro ao enviar mensagem:", e);
    res.json({ erro: e.message });
  }
});

app.listen(3000, () => {
  console.log("🌐 API online na porta 3000");
});
