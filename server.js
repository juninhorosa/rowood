import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import mysql from "mysql2/promise";
import express from "express";

/* ================================
   1. BANCO DE DADOS (SEGURO)
================================ */
const db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

/* ================================
   2. SESSÃO DO WHATSAPP
================================ */
const { state, saveCreds } = await useMultiFileAuthState('./auth');

const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state
});

sock.ev.on("creds.update", saveCreds);

console.log("🤖 BOT Rowood iniciado...");

/* ======================================
   3. EXPRESS SERVER
====================================== */
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Rowood WhatsApp Bot OK ✔");
});

/* ======================================
   4. ENDPOINT PARA O PAINEL (PHP)
====================================== */
app.post("/send-message", async (req, res) => {
    try {
        const { numero, mensagem } = req.body;

        if (!numero || !mensagem)
            return res.json({ erro: "Faltando parâmetros" });

        await sock.sendMessage(numero + "@s.whatsapp.net", {
            text: mensagem
        });

        res.json({ enviado: true });
    } catch (err) {
        res.json({ erro: err.message });
    }
});

/* ======================================
   5. RECEBER MENSAGENS DO USUÁRIO
====================================== */
sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || !msg.key.remoteJid) return;

    const from = msg.key.remoteJid;
    const texto = msg.message.conversation?.toLowerCase() || "";

    console.log("📩 Mensagem recebida:", texto);

    // Resposta simples
    if (texto.includes("oi") || texto.includes("ola")) {
        await sock.sendMessage(from, { text: "Olá! 👋 Sou o bot Rowood." });
    }
});

/* ======================================
   6. INICIAR HTTP
====================================== */
app.listen(3000, () => {
    console.log("🌐 Servidor HTTP ativo na porta 3000");
});
