import '../constants/app_constants.dart';

/// Wraps an external image URL through the local backend proxy.
/// Solves Android emulator network isolation — the emulator can reach
/// 10.0.2.2:3001 (host loopback) even when it cannot reach external CDNs.
String proxyImageUrl(String? url) {
  if (url == null || url.isEmpty) return '';
  return '$kBaseUrl/media/proxy?url=${Uri.encodeComponent(url)}';
}
