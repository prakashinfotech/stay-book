import 'package:dio/dio.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/auth_response_model.dart';

abstract class AuthRemoteDataSource {
  Future<({String userId, String? devOtp})> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  });

  Future<OtpResponseModel> verifyOtp({
    required String userId,
    required String code,
  });

  Future<LoginResponseModel> login({
    required String email,
    required String password,
  });

  Future<void> logout();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final Dio _dio;
  AuthRemoteDataSourceImpl(this._dio);

  String _extractError(dynamic body) {
    if (body is Map) {
      final err = body['error'];
      if (err is Map && err['message'] != null) return err['message'] as String;
      if (body['message'] != null) return body['message'] as String;
    }
    return 'Something went wrong';
  }

  @override
  Future<({String userId, String? devOtp})> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final res = await _dio.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
          'role': 'CUSTOMER',
        },
      );
      final data = res.data['data'] as Map<String, dynamic>;
      return (
        userId: data['userId'] as String,
        devOtp: data['devOtp'] as String?,
      );
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }

  @override
  Future<OtpResponseModel> verifyOtp({
    required String userId,
    required String code,
  }) async {
    try {
      final res = await _dio.post(
        '/auth/verify-otp',
        data: {'userId': userId, 'code': code},
      );
      return OtpResponseModel.fromJson(
        res.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }

  @override
  Future<LoginResponseModel> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return LoginResponseModel.fromJson(
        res.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }
}
