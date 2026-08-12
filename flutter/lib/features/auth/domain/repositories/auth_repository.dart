import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/register_result.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<Either<Failure, RegisterResult>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  });

  Future<Either<Failure, UserEntity>> verifyOtp({
    required String userId,
    required String code,
  });

  Future<Either<Failure, UserEntity>> login({
    required String email,
    required String password,
  });

  Future<Either<Failure, void>> logout();

  Future<Either<Failure, UserEntity?>> getCachedUser();
}
