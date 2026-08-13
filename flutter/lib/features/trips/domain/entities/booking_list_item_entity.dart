import 'package:equatable/equatable.dart';

class BookingListItemEntity extends Equatable {
  final String id;
  final String confirmationNumber;
  final String pin;
  final String status;
  final String checkin;
  final String checkout;
  final double totalPrice;
  final int adults;
  final int children;
  final String propertyName;
  final String? propertyCity;
  final String roomTypeName;
  final String guestName;
  final DateTime createdAt;
  final DateTime? cancelledAt;

  const BookingListItemEntity({
    required this.id,
    required this.confirmationNumber,
    required this.pin,
    required this.status,
    required this.checkin,
    required this.checkout,
    required this.totalPrice,
    required this.adults,
    required this.children,
    required this.propertyName,
    this.propertyCity,
    required this.roomTypeName,
    required this.guestName,
    required this.createdAt,
    this.cancelledAt,
  });

  bool get isUpcoming =>
      status == 'CONFIRMED' &&
      DateTime.parse(checkout).isAfter(DateTime.now());

  bool get isPast =>
      (status == 'CONFIRMED' || status == 'COMPLETED') &&
      !DateTime.parse(checkout).isAfter(DateTime.now());

  bool get isCancelled => status == 'CANCELLED';

  BookingListItemEntity copyWithStatus(String newStatus) =>
      BookingListItemEntity(
        id: id,
        confirmationNumber: confirmationNumber,
        pin: pin,
        status: newStatus,
        checkin: checkin,
        checkout: checkout,
        totalPrice: totalPrice,
        adults: adults,
        children: children,
        propertyName: propertyName,
        propertyCity: propertyCity,
        roomTypeName: roomTypeName,
        guestName: guestName,
        createdAt: createdAt,
        cancelledAt: newStatus == 'CANCELLED' ? DateTime.now() : cancelledAt,
      );

  @override
  List<Object?> get props => [
        id,
        confirmationNumber,
        status,
        checkin,
        checkout,
        totalPrice,
        adults,
        children,
        propertyName,
        roomTypeName,
        guestName,
        createdAt,
      ];
}
