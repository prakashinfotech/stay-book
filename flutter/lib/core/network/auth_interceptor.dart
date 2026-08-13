import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  final Dio _dio;

  AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: kAccessTokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final refreshToken = await _storage.read(key: kRefreshTokenKey);
      if (refreshToken != null) {
        try {
          final res = await _dio.post(
            '/auth/refresh',
            data: {'refreshToken': refreshToken},
          );
          final newToken = res.data['data']['accessToken'] as String;
          final newRefresh = res.data['data']['refreshToken'] as String? ??
              refreshToken;
          await _storage.write(key: kAccessTokenKey, value: newToken);
          await _storage.write(key: kRefreshTokenKey, value: newRefresh);
          err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
          final retried = await _dio.fetch(err.requestOptions);
          return handler.resolve(retried);
        } catch (_) {
          await _storage.deleteAll();
        }
      }
    }
    handler.next(err);
  }
}
