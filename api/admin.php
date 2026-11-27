<?php
declare(strict_types=1);
/* API لوحة التحكم: دخول، قايمة الطلبات، تفاصيل، تغيير الحالة، إحصائيات */
require __DIR__ . '/db.php';

session_name('mowga_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();

$a = $_GET['a'] ?? '';
$in = $_SERVER['REQUEST_METHOD'] === 'POST' ? body_json() : [];
$authed = !empty($_SESSION['admin']);

function need_csrf(array $in): void {
  if (!hash_equals($_SESSION['csrf'] ?? '', (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) json_out(['error' => 'csrf'], 403);
}

if ($a === 'login') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'POST only'], 405);
  $ip = $_SERVER['REMOTE_ADDR'] ?? '?'; $pdo = db(); $t = time();
  $pdo->prepare('DELETE FROM login_attempts WHERE at < ?')->execute([$t - 900]);
  $n = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip=?'); $n->execute([$ip]);
  if ((int)$n->fetchColumn() >= 8) json_out(['error' => 'محاولات كتير. استنى 15 دقيقة'], 429);
  $c = cfg();
  $ok = !empty($c['admin_hash']) && hash_equals((string)$c['admin_user'], (string)($in['user'] ?? '')) && password_verify((string)($in['pass'] ?? ''), $c['admin_hash']);
  if (!$ok) { $pdo->prepare('INSERT INTO login_attempts (ip,at) VALUES (?,?)')->execute([$ip, $t]); usleep(400000); json_out(['error' => 'اسم المستخدم أو الباسوورد غلط'], 401); }
  session_regenerate_id(true);
  $_SESSION['admin'] = true; $_SESSION['csrf'] = bin2hex(random_bytes(16));
  json_out(['ok' => true, 'csrf' => $_SESSION['csrf']]);
}
if ($a === 'me') json_out(['authed' => $authed, 'csrf' => $authed ? $_SESSION['csrf'] : null]);
if (!$authed) json_out(['error' => 'لازم تسجل دخول'], 401);

$pdo = db();
switch ($a) {
  case 'logout':
    need_csrf($in); $_SESSION = []; session_destroy(); json_out(['ok' => true]);

  case 'list':
    $w = []; $p = [];
    $status = $_GET['status'] ?? '';
    if ($status && isset(STATUSES[$status])) { $w[] = 'status=?'; $p[] = $status; }
    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') { $w[] = '(code LIKE ? OR name LIKE ? OR phone LIKE ?)'; array_push($p, "%$q%", "%$q%", "%$q%"); }
    $range = $_GET['range'] ?? 'all';
    if ($range === 'today') { $w[] = 'created_at >= ?'; $p[] = substr(now_str(), 0, 10) . ' 00:00:00'; }
    if ($range === 'week') { $w[] = 'created_at >= ?'; $p[] = (new DateTime('-7 days', new DateTimeZone('Africa/Cairo')))->format('Y-m-d 00:00:00'); }
    $sql = 'SELECT id,code,created_at,status,name,phone,area,day,slot,pay,total FROM orders' . ($w ? ' WHERE ' . implode(' AND ', $w) : '') . ' ORDER BY id DESC LIMIT 300';
    $st = $pdo->prepare($sql); $st->execute($p);
    json_out(['orders' => $st->fetchAll(), 'lastId' => (int)$pdo->query('SELECT COALESCE(MAX(id),0) FROM orders')->fetchColumn()]);

  case 'get':
    $st = $pdo->prepare('SELECT * FROM orders WHERE id=?'); $st->execute([(int)($_GET['id'] ?? 0)]);
    $o = $st->fetch(); if (!$o) json_out(['error' => 'not found'], 404);
    $o['items'] = json_decode($o['items'], true); $o['history'] = json_decode($o['history'], true);
    json_out(['order' => $o]);

  case 'status':
    need_csrf($in);
    $s = (string)($in['status'] ?? ''); $id = (int)($in['id'] ?? 0);
    if (!isset(STATUSES[$s])) json_out(['error' => 'bad status'], 422);
    $st = $pdo->prepare('SELECT history FROM orders WHERE id=?'); $st->execute([$id]);
    $h = $st->fetchColumn(); if ($h === false) json_out(['error' => 'not found'], 404);
    $h = json_decode($h, true) ?: []; $h[] = ['s' => $s, 'at' => now_str()];
    $pdo->prepare('UPDATE orders SET status=?, history=? WHERE id=?')->execute([$s, json_encode($h), $id]);
    json_out(['ok' => true]);

  case 'note':
    need_csrf($in);
    $pdo->prepare('UPDATE orders SET admin_note=? WHERE id=?')->execute([mb_substr((string)($in['note'] ?? ''), 0, 1000), (int)($in['id'] ?? 0)]);
    json_out(['ok' => true]);

  case 'stats':
    $today = substr(now_str(), 0, 10) . ' 00:00:00';
    $r = fn($sql, $p = []) => (function () use ($pdo, $sql, $p) { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn(); })();
    $counts = [];
    foreach ($pdo->query('SELECT status, COUNT(*) c FROM orders GROUP BY status') as $row) $counts[$row['status']] = (int)$row['c'];
    json_out([
      'today_orders' => (int)$r('SELECT COUNT(*) FROM orders WHERE created_at >= ? AND status <> ?', [$today, 'cancelled']),
      'today_revenue' => (int)$r('SELECT COALESCE(SUM(total),0) FROM orders WHERE created_at >= ? AND status <> ?', [$today, 'cancelled']),
      'counts' => $counts,
    ]);
}
json_out(['error' => 'unknown action'], 400);
