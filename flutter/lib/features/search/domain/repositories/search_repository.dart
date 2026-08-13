import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/destination_entity.dart';
import '../entities/search_params.dart';
import '../entities/search_result_entity.dart';

class SearchPage {
  final List<SearchResultEntity> results;
  final int total;
  final int page;
  final int limit;
  final int totalPages;
  const SearchPage({
    required this.results,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });
}

abstract class SearchRepository {
  Future<Either<Failure, SearchPage>> searchProperties(SearchParams params);
  Future<Either<Failure, List<String>>> getSuggestions(String q);
  Future<Either<Failure, List<DestinationEntity>>> getDestinationCounts();
  Future<Either<Failure, List<SearchResultEntity>>> getFeaturedProperties();
}
