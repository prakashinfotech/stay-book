import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_cached_user_usecase.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/verify_otp_usecase.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final GetCachedUserUseCase _getCachedUser;
  final LoginUseCase _login;
  final RegisterUseCase _register;
  final VerifyOtpUseCase _verifyOtp;
  final LogoutUseCase _logout;

  AuthBloc({
    required GetCachedUserUseCase getCachedUser,
    required LoginUseCase login,
    required RegisterUseCase register,
    required VerifyOtpUseCase verifyOtp,
    required LogoutUseCase logout,
  })  : _getCachedUser = getCachedUser,
        _login = login,
        _register = register,
        _verifyOtp = verifyOtp,
        _logout = logout,
        super(const AuthInitial()) {
    on<AppStarted>(_onAppStarted);
    on<LoginRequested>(_onLoginRequested);
    on<RegisterRequested>(_onRegisterRequested);
    on<OtpSubmitted>(_onOtpSubmitted);
    on<LogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onAppStarted(
    AppStarted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _getCachedUser();
    result.fold(
      (_) => emit(const AuthUnauthenticated()),
      (user) => user != null
          ? emit(AuthAuthenticated(user))
          : emit(const AuthUnauthenticated()),
    );
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _login(
      LoginParams(email: event.email, password: event.password),
    );
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (user) => emit(AuthAuthenticated(user)),
    );
  }

  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _register(
      RegisterParams(
        email: event.email,
        password: event.password,
        firstName: event.firstName,
        lastName: event.lastName,
      ),
    );
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (r) => emit(OtpPending(userId: r.userId, devOtp: r.devOtp)),
    );
  }

  Future<void> _onOtpSubmitted(
    OtpSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _verifyOtp(
      VerifyOtpParams(userId: event.userId, code: event.code),
    );
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (user) => emit(AuthAuthenticated(user)),
    );
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _logout();
    emit(const AuthUnauthenticated());
  }
}
