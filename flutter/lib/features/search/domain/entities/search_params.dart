import 'package:equatable/equatable.dart';

class SearchParams extends Equatable {
  final String destination;
  final String checkin;
  final String checkout;
  final int adults;
  final int page;
  final int limit;
  final String? category;

  const SearchParams({
    required this.destination,
    required this.checkin,
    required this.checkout,
    this.adults = 1,
    this.page = 1,
    this.limit = 12,
    this.category,
  });

  @override
  List<Object?> get props =>
      [destination, checkin, checkout, adults, page, limit, category];
}
