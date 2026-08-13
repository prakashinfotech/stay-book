import '../../domain/entities/user_entity.dart';

class UserModel {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String role;
  final bool emailVerified;
  final String createdAt;

  const UserModel({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    required this.role,
    required this.emailVerified,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        email: json['email'] as String,
        firstName: json['firstName'] as String?,
        lastName: json['lastName'] as String?,
        role: json['role'] as String,
        emailVerified: json['emailVerified'] as bool,
        createdAt: json['createdAt'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
        'emailVerified': emailVerified,
        'createdAt': createdAt,
      };

  UserEntity toEntity() => UserEntity(
        id: id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        emailVerified: emailVerified,
        createdAt: createdAt,
      );
}
