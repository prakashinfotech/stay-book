import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class GetCachedUserUseCase {
  final AuthRepository _repository;
  GetCachedUserUseCase(this._repository);

  Future<Either<Failure, UserEntity?>> call() => _repository.getCachedUser();
}
