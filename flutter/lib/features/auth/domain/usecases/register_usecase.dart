import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/errors/failures.dart';
import '../entities/register_result.dart';
import '../repositories/auth_repository.dart';

class RegisterUseCase {
  final AuthRepository _repository;
  RegisterUseCase(this._repository);

  Future<Either<Failure, RegisterResult>> call(RegisterParams params) =>
      _repository.register(
        email: params.email,
        password: params.password,
        firstName: params.firstName,
        lastName: params.lastName,
      );
}

class RegisterParams extends Equatable {
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  const RegisterParams({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
  });
  @override
  List<Object> get props => [email, password, firstName, lastName];
}
