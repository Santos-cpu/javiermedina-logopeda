<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: X-Auth-Token, Content-Type");
header("Access-Control-Allow-Methods: POST");

// 1. CONFIGURACIÓN DE SEGURIDAD
define('SECURITY_TOKEN', 'MiClaveSecreta123*'); // Recuerda cambiar esto en producción

// 2. VERIFICACIÓN DEL TOKEN
$headers = getallheaders();
$userToken = isset($headers['X-Auth-Token']) ? $headers['X-Auth-Token'] : '';

if ($userToken !== SECURITY_TOKEN) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Acceso no autorizado"]);
    exit;
}

// 3. PROCESAMIENTO GENERAL DE IMÁGENES
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['imagen'])) {
    $file = $_FILES['imagen'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExts = ['png', 'jpg', 'jpeg', 'webp'];

    // Validar extensión
    if (!in_array($ext, $allowedExts)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Formato no permitido (Usar PNG, JPG, JPEG o WEBP)"]);
        exit;
    }

    // Determinar si es una sustitución fija o una foto nueva de noticia
    if (isset($_POST['target']) && $_POST['target'] !== '') {
        $target_name = $_POST['target'];
        $allowedTargets = ['intervencion.png', 'pediatrica.png', 'aumentativos.png', 'asesoramiento.png', 'mapa-intervencion.png'];
        
        if (!in_array($target_name, $allowedTargets)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Archivo destino fijo no autorizado"]);
            exit;
        }
        
        $destination = '../' . $target_name;
        $finalFilename = $target_name;

        // --- SISTEMA DE BACKUP ---
        // Si la foto ya existe en el servidor, la renombramos con la fecha para no perderla
        if (file_exists($destination)) {
            $timestamp = date('Ymd_His');
            $backupName = pathinfo($target_name, PATHINFO_FILENAME) . '_' . $timestamp . '.' . $ext;
            rename($destination, '../' . $backupName);
        }
        
    } else {
        // Noticia nueva: Nombre dinámico único basado en timestamp
        $finalFilename = 'news_' . time() . '.' . $ext;
        $destination = '../' . $finalFilename;
    }

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        echo json_encode([
            "status" => "success", 
            "message" => "¡Fotografía procesada con éxito! Backup creado si era fija.",
            "filename" => $finalFilename
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error al guardar el archivo en el servidor"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Petición incompleta"]);
}
?>