import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String role;
  final bool emailVerified;
  final String createdAt;

  const UserEntity({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    required this.role,
    required this.emailVerified,
    required this.createdAt,
  });

  String get fullName {
    final parts = [firstName, lastName].whereType<String>().join(' ');
    return parts.isEmpty ? email : parts;
  }

  @override
  List<Object?> get props =>
      [id, email, firstName, lastName, role, emailVerified, createdAt];
}
