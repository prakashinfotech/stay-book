import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:staybook_app/core/errors/failures.dart';
import 'package:staybook_app/features/auth/domain/entities/user_entity.dart';
import 'package:staybook_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:staybook_app/features/auth/domain/usecases/verify_otp_usecase.dart';

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
  late VerifyOtpUseCase useCase;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    useCase = VerifyOtpUseCase(mockRepository);
  });

  const params = VerifyOtpParams(userId: 'user-id', code: '123456');

  test('returns UserEntity on valid OTP', () async {
    when(() => mockRepository.verifyOtp(
          userId: params.userId,
          code: params.code,
        )).thenAnswer((_) async => const Right(tUser));

    final result = await useCase(params);

    expect(result, const Right(tUser));
    verify(() => mockRepository.verifyOtp(
          userId: params.userId,
          code: params.code,
        )).called(1);
  });

  test('returns NetworkFailure when no internet', () async {
    when(() => mockRepository.verifyOtp(
          userId: any(named: 'userId'),
          code: any(named: 'code'),
        )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await useCase(params);

    expect(result, const Left(NetworkFailure()));
  });

  test('returns ServerFailure with message on invalid OTP', () async {
    when(() => mockRepository.verifyOtp(
          userId: any(named: 'userId'),
          code: any(named: 'code'),
        )).thenAnswer((_) async => const Left(ServerFailure('Invalid or expired OTP')));

    final result = await useCase(params);

    result.fold(
      (failure) => expect(failure.message, 'Invalid or expired OTP'),
      (_) => fail('Expected Left but got Right'),
    );
  });
}
