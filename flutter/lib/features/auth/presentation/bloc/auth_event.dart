import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();
}

class AppStarted extends AuthEvent {
  const AppStarted();
  @override
  List<Object> get props => [];
}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;
  const LoginRequested({required this.email, required this.password});
  @override
  List<Object> get props => [email, password];
}

class RegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  const RegisterRequested({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
  });
  @override
  List<Object> get props => [email, password, firstName, lastName];
}

class OtpSubmitted extends AuthEvent {
  final String userId;
  final String code;
  const OtpSubmitted({required this.userId, required this.code});
  @override
  List<Object> get props => [userId, code];
}

class LogoutRequested extends AuthEvent {
  const LogoutRequested();
  @override
  List<Object> get props => [];
}
