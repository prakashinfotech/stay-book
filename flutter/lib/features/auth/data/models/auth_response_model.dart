import 'user_model.dart';

class LoginResponseModel {
  final String accessToken;
  final String refreshToken;
  final UserModel user;

  const LoginResponseModel({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory LoginResponseModel.fromJson(Map<String, dynamic> json) =>
      LoginResponseModel(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      );
}

class OtpResponseModel {
  final String accessToken;
  final UserModel user;

  const OtpResponseModel({required this.accessToken, required this.user});

  factory OtpResponseModel.fromJson(Map<String, dynamic> json) =>
      OtpResponseModel(
        accessToken: json['accessToken'] as String,
        user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      );
}
