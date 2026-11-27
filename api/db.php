<?php
declare(strict_types=1);
/* اتصال قاعدة البيانات وإنشاء الجداول أول مرة */

function cfg(): array {
  static $c = null;
  if ($c === null) {
    $f = __DIR__ . '/config.php';
    if (!is_file($f)) { json_out(['error' => 'config.php مش موجود. انسخ config.sample.php باسم config.php'], 500); }
    $c = require $f;
  }
  return $c;
}

function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $c = cfg();
  $pdo = new PDO($c['db_dsn'], $c['db_user'] ?? null, $c['db_pass'] ?? null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  $mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
  $id = $mysql ? 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  $txt = $mysql ? 'TEXT' : 'TEXT';
  $eng = $mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4' : '';
  $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
    id $id,
    code VARCHAR(16) NOT NULL,
    created_at VARCHAR(19) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'new',
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    area VARCHAR(16) NOT NULL,
    address $txt NOT NULL,
    day VARCHAR(60) NOT NULL,
    slot VARCHAR(40) NOT NULL,
    pay VARCHAR(40) NOT NULL,
    notes $txt,
    items $txt NOT NULL,
    subtotal INT NOT NULL,
    fee INT NOT NULL,
    total INT NOT NULL,
    history $txt NOT NULL,
    admin_note $txt
  )$eng");
  $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (ip VARCHAR(64) NOT NULL, at INT NOT NULL)$eng");
  return $pdo;
}

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Content-Type-Options: nosniff');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function body_json(): array {
  $raw = file_get_contents('php://input', false, null, 0, 64000);
  $d = json_decode($raw ?: '', true);
  return is_array($d) ? $d : [];
}

function catalog(): array {
  static $c = null;
  if ($c === null) $c = json_decode((string)file_get_contents(__DIR__ . '/../data/catalog.json'), true) ?: [];
  return $c;
}

function now_str(): string {
  $d = new DateTime('now', new DateTimeZone('Africa/Cairo'));
  return $d->format('Y-m-d H:i:s');
}

const STATUSES = ['new' => 'جديد', 'confirmed' => 'اتأكد', 'preparing' => 'بيتجهز', 'out' => 'في الطريق', 'delivered' => 'اتسلم', 'cancelled' => 'اتلغى'];
