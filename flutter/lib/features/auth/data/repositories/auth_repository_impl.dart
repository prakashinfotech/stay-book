import 'dart:convert';
import 'dart:io';

import 'package:dartz/dartz.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/register_result.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDs;
  final FlutterSecureStorage _storage;

  AuthRepositoryImpl(this._remoteDs, this._storage);

  @override
  Future<Either<Failure, RegisterResult>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final result = await _remoteDs.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );
      return Right(
        RegisterResult(userId: result.userId, devOtp: result.devOtp),
      );
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, UserEntity>> verifyOtp({
    required String userId,
    required String code,
  }) async {
    try {
      final model = await _remoteDs.verifyOtp(userId: userId, code: code);
      await _storage.write(key: kAccessTokenKey, value: model.accessToken);
      await _saveUser(model.user);
      return Right(model.user.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, UserEntity>> login({
    required String email,
    required String password,
  }) async {
    try {
      final model = await _remoteDs.login(email: email, password: password);
      await _storage.write(key: kAccessTokenKey, value: model.accessToken);
      await _storage.write(key: kRefreshTokenKey, value: model.refreshToken);
      await _saveUser(model.user);
      return Right(model.user.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await _remoteDs.logout();
    } catch (_) {
      // best-effort — clear storage regardless
    }
    await _storage.deleteAll();
    return const Right(null);
  }

  @override
  Future<Either<Failure, UserEntity?>> getCachedUser() async {
    try {
      final token = await _storage.read(key: kAccessTokenKey);
      if (token == null) return const Right(null);
      final userJson = await _storage.read(key: kUserJsonKey);
      if (userJson == null) return const Right(null);
      final map = jsonDecode(userJson) as Map<String, dynamic>;
      return Right(UserModel.fromJson(map).toEntity());
    } catch (_) {
      return const Right(null);
    }
  }

  Future<void> _saveUser(UserModel user) async {
    await _storage.write(key: kUserJsonKey, value: jsonEncode(user.toJson()));
  }
}
