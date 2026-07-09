<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: X-Auth-Token, Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('SECURITY_TOKEN', 'MiClaveSecreta123*'); 
$headers = getallheaders();
$userToken = isset($headers['X-Auth-Token']) ? $headers['X-Auth-Token'] : '';

if ($userToken !== SECURITY_TOKEN) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Acceso no autorizado"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['filename']) && $data['filename'] !== '') {
    $filename = basename($data['filename']); // Sanitizamos el nombre por seguridad
    $destination = '../' . $filename;

    // Solo permitimos borrar archivos que empiecen por "news_"
    if (strpos($filename, 'news_') === 0 && file_exists($destination)) {
        unlink($destination); // Comando PHP para destruir el archivo
        echo json_encode(["status" => "success", "message" => "Imagen destruida del servidor"]);
    } else {
        echo json_encode(["status" => "success", "message" => "La imagen ya no existe o es un archivo protegido"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Falta el nombre del archivo"]);
}
?>