<?php
// notificar.php → Arquivo que o painel chama
// Ele envia requisição ao BOT Node.js via JSON (porta 3000)

header("Content-Type: application/json; charset=utf-8");

if (!isset($_GET['numero']) || !isset($_GET['msg'])) {
    echo json_encode(["erro" => "Parâmetros faltando"]);
    exit();
}

$numero  = preg_replace('/\D/', '', $_GET['numero']); // sanitiza
$mensagem = $_GET['msg'];

$data = [
    "numero" => $numero,
    "mensagem" => $mensagem
];

$curl = curl_init("http://localhost:3000/send-message");

curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($curl, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);
curl_close($curl);

echo $response;
