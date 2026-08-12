import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';
import 'auth_interceptor.dart';

class DioClient {
  late final Dio dio;

  DioClient(FlutterSecureStorage storage) {
    dio = Dio(
      BaseOptions(
        baseUrl: kBaseUrl,
        connectTimeout: const Duration(milliseconds: kConnectTimeoutMs),
        receiveTimeout: const Duration(milliseconds: kReceiveTimeoutMs),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        },
      ),
    );
    dio.interceptors.add(AuthInterceptor(storage, dio));
  }
}
