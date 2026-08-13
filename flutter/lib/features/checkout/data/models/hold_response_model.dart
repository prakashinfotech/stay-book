import '../../domain/entities/hold_result_entity.dart';

class HoldResponseModel {
  final String id;
  final String expiresAt;
  final String roomTypeId;
  final String propertyId;
  final String checkin;
  final String checkout;

  const HoldResponseModel({
    required this.id,
    required this.expiresAt,
    required this.roomTypeId,
    required this.propertyId,
    required this.checkin,
    required this.checkout,
  });

  factory HoldResponseModel.fromJson(Map<String, dynamic> json) {
    return HoldResponseModel(
      id: json['id'] as String,
      expiresAt: json['expiresAt'] as String,
      roomTypeId: json['roomTypeId'] as String,
      propertyId: json['propertyId'] as String,
      checkin: json['checkin'] as String,
      checkout: json['checkout'] as String,
    );
  }

  HoldResultEntity toEntity() => HoldResultEntity(
        id: id,
        expiresAt: DateTime.parse(expiresAt),
        roomTypeId: roomTypeId,
        propertyId: propertyId,
        checkin: checkin,
        checkout: checkout,
      );
}
