import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/errors/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class VerifyOtpUseCase {
  final AuthRepository _repository;
  VerifyOtpUseCase(this._repository);

  Future<Either<Failure, UserEntity>> call(VerifyOtpParams params) =>
      _repository.verifyOtp(userId: params.userId, code: params.code);
}

class VerifyOtpParams extends Equatable {
  final String userId;
  final String code;
  const VerifyOtpParams({required this.userId, required this.code});
  @override
  List<Object> get props => [userId, code];
}
