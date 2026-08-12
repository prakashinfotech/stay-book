import '../../domain/entities/property_entity.dart';

class RatePlanModel {
  final String id;
  final String planType;
  final double discountPercent;
  final int minNights;

  const RatePlanModel({
    required this.id,
    required this.planType,
    required this.discountPercent,
    required this.minNights,
  });

  factory RatePlanModel.fromJson(Map<String, dynamic> json) => RatePlanModel(
        id: json['id'] as String,
        planType: json['planType'] as String,
        discountPercent: double.parse(json['discountPercent'].toString()),
        minNights: (json['minNights'] as num).toInt(),
      );

  RatePlanEntity toEntity() => RatePlanEntity(
        id: id,
        planType: planType,
        discountPercent: discountPercent,
        minNights: minNights,
      );
}

class RoomTypeModel {
  final String id;
  final String name;
  final String? description;
  final int maxOccupancy;
  final double basePrice;
  final String mealPlan;
  final String cancellationPolicy;
  final List<RatePlanModel> ratePlans;

  const RoomTypeModel({
    required this.id,
    required this.name,
    this.description,
    required this.maxOccupancy,
    required this.basePrice,
    required this.mealPlan,
    required this.cancellationPolicy,
    required this.ratePlans,
  });

  factory RoomTypeModel.fromJson(Map<String, dynamic> json) => RoomTypeModel(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        maxOccupancy: (json['maxOccupancy'] as num).toInt(),
        basePrice: double.parse(json['basePrice'].toString()),
        mealPlan: json['mealPlan'] as String,
        cancellationPolicy: json['cancellationPolicy'] as String,
        ratePlans: (json['ratePlans'] as List? ?? [])
            .map((e) => RatePlanModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  RoomTypeEntity toEntity() => RoomTypeEntity(
        id: id,
        name: name,
        description: description,
        maxOccupancy: maxOccupancy,
        basePrice: basePrice,
        mealPlan: mealPlan,
        cancellationPolicy: cancellationPolicy,
        ratePlans: ratePlans.map((r) => r.toEntity()).toList(),
      );
}

class PropertyImageModel {
  final String id;
  final String url;
  final String tag;
  final int sortOrder;

  const PropertyImageModel({
    required this.id,
    required this.url,
    required this.tag,
    required this.sortOrder,
  });

  factory PropertyImageModel.fromJson(Map<String, dynamic> json) =>
      PropertyImageModel(
        id: json['id'] as String,
        url: json['url'] as String,
        tag: json['tag'] as String,
        sortOrder: (json['sortOrder'] as num).toInt(),
      );

  PropertyImageEntity toEntity() => PropertyImageEntity(
        id: id,
        url: url,
        tag: tag,
        sortOrder: sortOrder,
      );
}

class PropertyModel {
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
  final List<PropertyImageModel> images;
  final List<RoomTypeModel> roomTypes;

  const PropertyModel({
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

  factory PropertyModel.fromJson(Map<String, dynamic> json) => PropertyModel(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        address: json['address'] as String,
        city: json['city'] as String,
        category: json['category'] as String,
        starRating: json['starRating'] != null
            ? (json['starRating'] as num).toDouble()
            : null,
        amenities: json['amenities'] == null
            ? []
            : (json['amenities'] as List).map((e) => e.toString()).toList(),
        bookingMode: json['bookingMode'] as String? ?? 'INSTANT',
        status: json['status'] as String,
        images: (json['images'] as List? ?? [])
            .map((e) => PropertyImageModel.fromJson(e as Map<String, dynamic>))
            .toList(),
        roomTypes: (json['roomTypes'] as List? ?? [])
            .map((e) => RoomTypeModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  PropertyEntity toEntity() => PropertyEntity(
        id: id,
        name: name,
        description: description,
        address: address,
        city: city,
        category: category,
        starRating: starRating,
        amenities: amenities,
        bookingMode: bookingMode,
        status: status,
        images: images.map((i) => i.toEntity()).toList(),
        roomTypes: roomTypes.map((r) => r.toEntity()).toList(),
      );
}
