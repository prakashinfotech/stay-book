import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:staybook_app/core/errors/failures.dart';
import 'package:staybook_app/features/auth/domain/entities/register_result.dart';
import 'package:staybook_app/features/auth/domain/entities/user_entity.dart';
import 'package:staybook_app/features/auth/domain/usecases/get_cached_user_usecase.dart';
import 'package:staybook_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:staybook_app/features/auth/domain/usecases/logout_usecase.dart';
import 'package:staybook_app/features/auth/domain/usecases/register_usecase.dart';
import 'package:staybook_app/features/auth/domain/usecases/verify_otp_usecase.dart';
import 'package:staybook_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:staybook_app/features/auth/presentation/bloc/auth_event.dart';
import 'package:staybook_app/features/auth/presentation/bloc/auth_state.dart';

class MockLoginUseCase extends Mock implements LoginUseCase {}
class MockRegisterUseCase extends Mock implements RegisterUseCase {}
class MockVerifyOtpUseCase extends Mock implements VerifyOtpUseCase {}
class MockLogoutUseCase extends Mock implements LogoutUseCase {}
class MockGetCachedUserUseCase extends Mock implements GetCachedUserUseCase {}

class FakeLoginParams extends Fake implements LoginParams {}
class FakeRegisterParams extends Fake implements RegisterParams {}
class FakeVerifyOtpParams extends Fake implements VerifyOtpParams {}

const tUser = UserEntity(
  id: 'user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'CUSTOMER',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
);

const tRegisterResult = RegisterResult(
  userId: 'user-id',
  devOtp: '123456',
);

void main() {
  setUpAll(() {
    registerFallbackValue(FakeLoginParams());
    registerFallbackValue(FakeRegisterParams());
    registerFallbackValue(FakeVerifyOtpParams());
  });

  late AuthBloc bloc;
  late MockLoginUseCase mockLogin;
  late MockRegisterUseCase mockRegister;
  late MockVerifyOtpUseCase mockVerifyOtp;
  late MockLogoutUseCase mockLogout;
  late MockGetCachedUserUseCase mockGetCachedUser;

  setUp(() {
    mockLogin = MockLoginUseCase();
    mockRegister = MockRegisterUseCase();
    mockVerifyOtp = MockVerifyOtpUseCase();
    mockLogout = MockLogoutUseCase();
    mockGetCachedUser = MockGetCachedUserUseCase();

    bloc = AuthBloc(
      getCachedUser: mockGetCachedUser,
      login: mockLogin,
      register: mockRegister,
      verifyOtp: mockVerifyOtp,
      logout: mockLogout,
    );
  });

  tearDown(() => bloc.close());

  // ─── LoginRequested ─────────────────────────────────────────────────────────

  group('LoginRequested', () {
    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthAuthenticated] on success',
      build: () {
        when(() => mockLogin(any()))
            .thenAnswer((_) async => const Right(tUser));
        return bloc;
      },
      act: (b) => b.add(const LoginRequested(
        email: 'test@example.com',
        password: 'Password1',
      )),
      expect: () => [
        const AuthLoading(),
        const AuthAuthenticated(tUser),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthError] on network failure',
      build: () {
        when(() => mockLogin(any()))
            .thenAnswer((_) async => const Left(NetworkFailure()));
        return bloc;
      },
      act: (b) => b.add(const LoginRequested(
        email: 'test@example.com',
        password: 'Password1',
      )),
      expect: () => [
        const AuthLoading(),
        const AuthError('No internet connection'),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthError] on wrong password',
      build: () {
        when(() => mockLogin(any())).thenAnswer(
          (_) async => const Left(ServerFailure('Invalid credentials')),
        );
        return bloc;
      },
      act: (b) => b.add(const LoginRequested(
        email: 'test@example.com',
        password: 'wrongpass',
      )),
      expect: () => [
        const AuthLoading(),
        const AuthError('Invalid credentials'),
      ],
    );
  });

  // ─── RegisterRequested ──────────────────────────────────────────────────────

  group('RegisterRequested', () {
    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, OtpPending] on success',
      build: () {
        when(() => mockRegister(any()))
            .thenAnswer((_) async => const Right(tRegisterResult));
        return bloc;
      },
      act: (b) => b.add(const RegisterRequested(
        email: 'test@example.com',
        password: 'Password1',
        firstName: 'Test',
        lastName: 'User',
      )),
      expect: () => [
        const AuthLoading(),
        const OtpPending(userId: 'user-id', devOtp: '123456'),
      ],
    );

    blocTest<AuthBloc, AuthState>(
      'emits [AuthLoading, AuthError] on duplicate email',
      build: () {
        when(() => mockRegister(any())).thenAnswer(
          (_) async =>
              const Left(ServerFailure('Email already registered')),
        );
        return bloc;
      },
      act: (b) => b.add(const RegisterRequested(
        email: 'test@example.com',
        password: 'Password1',
        firstName: 'Test',
        lastName: 'User',
      )),
      expect: () => [
        const AuthLoading(),
        const AuthError('Email already registered'),
      ],
    );
  });
}
