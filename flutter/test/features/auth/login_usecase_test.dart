import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:staybook_app/core/errors/failures.dart';
import 'package:staybook_app/features/auth/domain/entities/user_entity.dart';
import 'package:staybook_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:staybook_app/features/auth/domain/usecases/login_usecase.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

const tUser = UserEntity(
  id: 'user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'CUSTOMER',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
);

void main() {
  late LoginUseCase useCase;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    useCase = LoginUseCase(mockRepository);
  });

  const params = LoginParams(email: 'test@example.com', password: 'Password1');

  test('returns UserEntity on successful login', () async {
    when(() => mockRepository.login(
          email: params.email,
          password: params.password,
        )).thenAnswer((_) async => const Right(tUser));

    final result = await useCase(params);

    expect(result, const Right(tUser));
    verify(() => mockRepository.login(
          email: params.email,
          password: params.password,
        )).called(1);
  });

  test('returns NetworkFailure when no internet', () async {
    when(() => mockRepository.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
        )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await useCase(params);

    expect(result, const Left(NetworkFailure()));
  });

  test('returns ServerFailure with message on invalid credentials', () async {
    when(() => mockRepository.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
        )).thenAnswer((_) async => const Left(ServerFailure('Invalid credentials')));

    final result = await useCase(params);

    result.fold(
      (failure) => expect(failure.message, 'Invalid credentials'),
      (_) => fail('Expected Left but got Right'),
    );
  });
}
