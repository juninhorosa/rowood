import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import mysql from "mysql2/promise";
import express from "express";

/* ===============================================
   1. Conexão com Banco de Dados (VARIÁVEIS DE AMBIENTE)
================================================ */
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

/* ===============================================
   2. Inicialização da sessão WhatsApp
================================================ */
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const { version } = await fetchLatestBaileysVersion();
  console.log("📌 Versão WhatsApp API:", version);

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  console.log("🤖 BOT WhatsApp iniciado!");

  /* ============================================
     3. Receber mensagens
  =============================================*/
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const texto = msg.message.conversation || "";
    const numero = msg.key.remoteJid.replace("@s.whatsapp.net", "");

    console.log("📩 Mensagem de", numero, ":", texto);

    if (texto.toLowerCase() === "oi") {
      await sock.sendMessage(msg.key.remoteJid, { text: "Olá, sou o BOT Rowood 👷‍♂️" });
    }
  });

  return sock;
}

const sock = await startBot();

/* ===============================================
   4. Servidor HTTP Express (Render usa isso)
================================================ */
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Rowood BOT Online ✔");
});

/* ===============================================
   5. Endpoint para enviar mensagem pelo painel PHP
================================================ */
app.post("/send-message", async (req, res) => {
  try {
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
      return res.status(400).json({ erro: "Parâmetros faltando" });
    }

    await sock.sendMessage(numero + "@s.whatsapp.net", {
      text: mensagem
    });

    res.json({ enviado: true });
  } catch (err) {
    res.json({ erro: err.message });
  }
});

/* ===============================================
   6. Iniciar servidor Express
================================================ */
app.listen(3000, () => {
  console.log("🌐 Servidor HTTP ativo na porta 3000");
});
