<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: X-Auth-Token, Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('SECURITY_TOKEN', 'MiClaveSecreta123*'); 
// Guardamos el JSON en la raíz para que tu web pública pueda leerlo también fácilmente
$file_path = '../categories.json'; 

// LECTURA (Cualquiera puede leer las categorías para mostrarlas)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    if (file_exists($file_path)) {
        echo file_get_contents($file_path);
    } else {
        // Si el archivo no existe aún, devolvemos las categorías por defecto
        echo json_encode([
            ["id" => "infantil", "name" => "Infantil y Aprendizaje"],
            ["id" => "adultos", "name" => "Adultos y Deglución"],
            ["id" => "saac", "name" => "Sistemas SAAC"],
            ["id" => "consejos", "name" => "Consejos en Casa"]
        ]);
    }
    exit;
}

// ESCRITURA (Protegida con contraseña)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $headers = getallheaders();
    $userToken = isset($headers['X-Auth-Token']) ? $headers['X-Auth-Token'] : '';
    
    if ($userToken !== SECURITY_TOKEN) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Acceso no autorizado"]);
        exit;
    }

    $data = file_get_contents("php://input");
    
    if (json_decode($data) !== null) {
        file_put_contents($file_path, $data);
        echo json_encode(["status" => "success", "message" => "Categorías guardadas correctamente"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Datos inválidos"]);
    }
    exit;
}
?>