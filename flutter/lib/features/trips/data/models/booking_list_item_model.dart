import '../../domain/entities/booking_list_item_entity.dart';

class BookingListItemModel {
  final String id;
  final String confirmationNumber;
  final String pin;
  final String status;
  final String checkin;
  final String checkout;
  final String totalPrice;
  final int adults;
  final int children;
  final String propertyName;
  final String? propertyCity;
  final String roomTypeName;
  final String guestName;
  final String createdAt;
  final String? cancelledAt;

  const BookingListItemModel({
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

  factory BookingListItemModel.fromJson(Map<String, dynamic> json) {
    final property = json['property'] as Map<String, dynamic>?;
    final roomType = json['roomType'] as Map<String, dynamic>?;
    return BookingListItemModel(
      id: json['id'] as String,
      confirmationNumber: json['confirmationNumber'] as String,
      pin: json['pin'] as String? ?? '',
      status: json['status'] as String,
      checkin: json['checkin'] as String,
      checkout: json['checkout'] as String,
      totalPrice: json['totalPrice'].toString(),
      adults: json['adults'] as int? ?? 1,
      children: json['children'] as int? ?? 0,
      propertyName: property?['name'] as String? ?? 'Unknown Property',
      propertyCity: property?['city'] as String?,
      roomTypeName: roomType?['name'] as String? ?? 'Unknown Room',
      guestName: json['guestName'] as String? ?? '',
      createdAt: json['createdAt'] as String,
      cancelledAt: json['cancelledAt'] as String?,
    );
  }

  BookingListItemEntity toEntity() => BookingListItemEntity(
        id: id,
        confirmationNumber: confirmationNumber,
        pin: pin,
        status: status,
        checkin: checkin,
        checkout: checkout,
        totalPrice: double.parse(totalPrice),
        adults: adults,
        children: children,
        propertyName: propertyName,
        propertyCity: propertyCity,
        roomTypeName: roomTypeName,
        guestName: guestName,
        createdAt: DateTime.parse(createdAt),
        cancelledAt: cancelledAt != null ? DateTime.parse(cancelledAt!) : null,
      );
}
