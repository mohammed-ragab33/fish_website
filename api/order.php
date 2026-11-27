<?php
declare(strict_types=1);
/* استقبال طلب جديد من صفحة السلة. الأسعار بتتحسب هنا من الكتالوج، مش من المتصفح */
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'POST only'], 405);
$in = body_json();
$cat = catalog();
$S = $cat['settings'] ?? [];
$byId = [];
foreach ($cat['products'] ?? [] as $p) $byId[$p['id']] = $p;

$err = [];
$s = fn($k, $max) => mb_substr(trim((string)($in[$k] ?? '')), 0, $max);
$name = $s('name', 120); $phone = preg_replace('/\s+/', '', $s('phone', 20));
$area = $s('area', 16); $address = $s('address', 500); $notes = $s('notes', 500);
$day = $s('day', 60); $slot = $s('slot', 40); $pay = $s('pay', 40);

if (mb_strlen($name) < 2) $err['name'] = 'اكتب اسمك';
if (!preg_match('/^01[0125][0-9]{8}$/', $phone)) $err['phone'] = 'رقم موبايل مصري صحيح من 11 رقم';
if (!isset($S['areas'][$area])) $err['area'] = 'اختار المنطقة';
if (mb_strlen($address) < 8) $err['address'] = 'اكتب العنوان بالتفصيل';
if (!in_array($slot, $S['slots'] ?? [], true)) $err['slot'] = 'اختار الساعة';
if (!in_array($pay, $S['pay'] ?? [], true)) $err['pay'] = 'اختار طريقة الدفع';
if ($day === '') $err['day'] = 'اختار يوم التوصيل';

$items = []; $sub = 0;
foreach (array_slice((array)($in['items'] ?? []), 0, 50) as $it) {
  $p = $byId[$it['id'] ?? ''] ?? null;
  $wi = (int)($it['wi'] ?? 0); $qty = max(1, min(50, (int)($it['qty'] ?? 1)));
  if (!$p || !isset($p['w'][$wi])) continue;
  $unit = (int)round($p['price'] * $p['w'][$wi][1]);
  $items[] = ['id' => $p['id'], 'name' => $p['name'], 'w' => $p['w'][$wi][0], 'qty' => $qty, 'unit' => $unit, 'line' => $unit * $qty];
  $sub += $unit * $qty;
}
if (!$items) $err['items'] = 'السلة فاضية';
if ($err) json_out(['error' => 'راجع البيانات', 'fields' => $err], 422);

$fee = $sub >= (int)($S['freeOver'] ?? PHP_INT_MAX) ? 0 : (int)($S['fees'][$area] ?? 0);
$total = $sub + $fee;
$now = now_str();

$pdo = db();
$pdo->beginTransaction();
$st = $pdo->prepare('INSERT INTO orders (code,created_at,status,name,phone,area,address,day,slot,pay,notes,items,subtotal,fee,total,history) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
$st->execute(['TMP', $now, 'new', $name, $phone, $area, $address, $day, $slot, $pay, $notes,
  json_encode($items, JSON_UNESCAPED_UNICODE), $sub, $fee, $total, json_encode([['s' => 'new', 'at' => $now]])]);
$id = (int)$pdo->lastInsertId();
$code = 'MW-' . (1000 + $id);
$pdo->prepare('UPDATE orders SET code=? WHERE id=?')->execute([$code, $id]);
$pdo->commit();

$to = cfg()['notify_email'] ?? '';
if ($to) {
  $lines = array_map(fn($i) => "- {$i['name']} ({$i['w']}) × {$i['qty']} = {$i['line']} ج.م", $items);
  $msg = "طلب جديد $code\n$name - $phone\n{$S['areas'][$area]}: $address\n$day، $slot\n$pay\n\n" . implode("\n", $lines) . "\n\nالإجمالي: $total ج.م";
  @mail($to, "=?UTF-8?B?" . base64_encode("طلب جديد $code - $total ج.م") . "?=", $msg, "Content-Type: text/plain; charset=UTF-8");
}
json_out(['ok' => true, 'code' => $code, 'total' => $total, 'fee' => $fee, 'subtotal' => $sub]);
