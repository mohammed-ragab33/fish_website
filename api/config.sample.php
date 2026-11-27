<?php
/*
 * انسخ الملف ده باسم config.php وحط فيه بيانات Hostinger.
 * config.php مش بيترفع على GitHub (موجود في .gitignore).
 */
return [
  // قاعدة البيانات: من لوحة Hostinger ← Databases ← MySQL
  'db_dsn'  => 'mysql:host=localhost;dbname=u000000000_mowga;charset=utf8mb4',
  'db_user' => 'u000000000_mowga',
  'db_pass' => 'CHANGE_ME',

  // باسوورد لوحة التحكم: اعمله بالأمر ده وحط الناتج هنا
  // php -r "echo password_hash('الباسوورد بتاعك', PASSWORD_DEFAULT);"
  'admin_user' => 'admin',
  'admin_hash' => '',

  // إيميل يوصله تنبيه بكل طلب جديد (اختياري، سيبه فاضي لو مش عايز)
  'notify_email' => '',
];
