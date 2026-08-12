import '../../domain/entities/booking_entity.dart';

class BookingModel {
  final String id;
  final String confirmationNumber;
  final String pin;
  final String totalPrice;
  final String checkin;
  final String checkout;
  final String status;
  final int adults;
  final int children;

  const BookingModel({
    required this.id,
    required this.confirmationNumber,
    required this.pin,
    required this.totalPrice,
    required this.checkin,
    required this.checkout,
    required this.status,
    required this.adults,
    required this.children,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'] as String,
      confirmationNumber: json['confirmationNumber'] as String,
      pin: json['pin'] as String,
      totalPrice: json['totalPrice'].toString(),
      checkin: json['checkin'] as String,
      checkout: json['checkout'] as String,
      status: json['status'] as String? ?? 'CONFIRMED',
      adults: json['adults'] as int? ?? 1,
      children: json['children'] as int? ?? 0,
    );
  }

  BookingEntity toEntity() => BookingEntity(
        id: id,
        confirmationNumber: confirmationNumber,
        pin: pin,
        totalPrice: double.parse(totalPrice),
        checkin: checkin,
        checkout: checkout,
        status: status,
        adults: adults,
        children: children,
      );
}
