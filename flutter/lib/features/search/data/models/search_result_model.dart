import '../../domain/entities/search_result_entity.dart';

class SearchResultModel {
  final String id;
  final String name;
  final String city;
  final String address;
  final String category;
  final double? starRating;
  final String? minPrice;
  final String? coverImage;
  final String bookingMode;
  final String? description;

  const SearchResultModel({
    required this.id,
    required this.name,
    required this.city,
    required this.address,
    required this.category,
    this.starRating,
    this.minPrice,
    this.coverImage,
    required this.bookingMode,
    this.description,
  });

  factory SearchResultModel.fromJson(Map<String, dynamic> json) =>
      SearchResultModel(
        id: json['id'] as String,
        name: json['name'] as String,
        city: json['city'] as String,
        address: json['address'] as String,
        category: json['category'] as String,
        starRating: (json['star_rating'] as num?)?.toDouble(),
        minPrice: json['min_price'] as String?,
        coverImage: json['cover_image'] as String?,
        bookingMode: json['booking_mode'] as String,
        description: json['description'] as String?,
      );

  SearchResultEntity toEntity() => SearchResultEntity(
        id: id,
        name: name,
        city: city,
        address: address,
        category: category,
        starRating: starRating,
        minPrice: minPrice,
        coverImage: coverImage,
        bookingMode: bookingMode,
        description: description,
      );
}
