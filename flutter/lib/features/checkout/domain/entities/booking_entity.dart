import 'package:equatable/equatable.dart';

class BookingEntity extends Equatable {
  final String id;
  final String confirmationNumber;
  final String pin;
  final double totalPrice;
  final String checkin;
  final String checkout;
  final String status;
  final int adults;
  final int children;

  const BookingEntity({
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

  @override
  List<Object?> get props => [
        id,
        confirmationNumber,
        pin,
        totalPrice,
        checkin,
        checkout,
        status,
        adults,
        children,
      ];
}
