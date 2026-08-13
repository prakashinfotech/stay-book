import 'package:equatable/equatable.dart';

class HoldResultEntity extends Equatable {
  final String id;
  final DateTime expiresAt;
  final String roomTypeId;
  final String propertyId;
  final String checkin;
  final String checkout;

  const HoldResultEntity({
    required this.id,
    required this.expiresAt,
    required this.roomTypeId,
    required this.propertyId,
    required this.checkin,
    required this.checkout,
  });

  @override
  List<Object?> get props => [id, expiresAt, roomTypeId, propertyId, checkin, checkout];
}
