import 'package:equatable/equatable.dart';

class RatePlanEntity extends Equatable {
  final String id;
  final String planType;
  final double discountPercent;
  final int minNights;

  const RatePlanEntity({
    required this.id,
    required this.planType,
    required this.discountPercent,
    required this.minNights,
  });

  double discountedPrice(double basePrice) =>
      basePrice * (1 - discountPercent / 100);

  @override
  List<Object> get props => [id, planType, discountPercent, minNights];
}

class RoomTypeEntity extends Equatable {
  final String id;
  final String name;
  final String? description;
  final int maxOccupancy;
  final double basePrice;
  final String mealPlan;
  final String cancellationPolicy;
  final List<RatePlanEntity> ratePlans;

  const RoomTypeEntity({
    required this.id,
    required this.name,
    this.description,
    required this.maxOccupancy,
    required this.basePrice,
    required this.mealPlan,
    required this.cancellationPolicy,
    required this.ratePlans,
  });

  RatePlanEntity? get defaultPlan =>
      ratePlans.isNotEmpty ? ratePlans.first : null;

  @override
  List<Object?> get props =>
      [id, name, maxOccupancy, basePrice, mealPlan, cancellationPolicy];
}

class PropertyImageEntity extends Equatable {
  final String id;
  final String url;
  final String tag;
  final int sortOrder;

  const PropertyImageEntity({
    required this.id,
    required this.url,
    required this.tag,
    required this.sortOrder,
  });

  @override
  List<Object> get props => [id, url, tag, sortOrder];
}

class PropertyEntity extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String address;
  final String city;
  final String category;
  final double? starRating;
  final List<String> amenities;
  final String bookingMode;
  final String status;
  final List<PropertyImageEntity> images;
  final List<RoomTypeEntity> roomTypes;

  const PropertyEntity({
    required this.id,
    required this.name,
    this.description,
    required this.address,
    required this.city,
    required this.category,
    this.starRating,
    required this.amenities,
    required this.bookingMode,
    required this.status,
    required this.images,
    required this.roomTypes,
  });

  String? get coverImageUrl =>
      images.isNotEmpty ? images.first.url : null;

  @override
  List<Object?> get props => [id, name, city, category, status];
}
