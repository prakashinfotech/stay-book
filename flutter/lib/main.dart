import 'dart:io';
import 'package:flutter/material.dart';
import 'app.dart';
import 'injection_container.dart' as di;

class _BrowserHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    client.badCertificateCallback = (_, __, ___) => true; // dev-only
    client.userAgent =
        'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
    return client;
  }
}

void main() async {
  HttpOverrides.global = _BrowserHttpOverrides();
  WidgetsFlutterBinding.ensureInitialized();
  await di.init();
  runApp(const StayBookApp());
}
