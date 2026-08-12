import 'package:equatable/equatable.dart';

class SearchResultEntity extends Equatable {
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

  const SearchResultEntity({
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

  @override
  List<Object?> get props =>
      [id, name, city, address, category, starRating, minPrice, coverImage, bookingMode];
}
