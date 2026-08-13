import 'package:equatable/equatable.dart';
import '../../domain/entities/destination_entity.dart';
import '../../domain/entities/search_params.dart';
import '../../domain/entities/search_result_entity.dart';

abstract class SearchState extends Equatable {
  const SearchState();
}

class SearchInitial extends SearchState {
  const SearchInitial();
  @override
  List<Object> get props => [];
}

class SearchLoading extends SearchState {
  const SearchLoading();
  @override
  List<Object> get props => [];
}

class SearchHomeLoaded extends SearchState {
  final List<DestinationEntity> destinations;
  final List<SearchResultEntity> featured;
  const SearchHomeLoaded(this.destinations, {this.featured = const []});
  @override
  List<Object> get props => [destinations, featured];
}

class SearchResultsLoaded extends SearchState {
  final List<DestinationEntity> destinations;
  final List<SearchResultEntity> results;
  final int total;
  final int page;
  final int totalPages;
  final SearchParams params;

  const SearchResultsLoaded({
    required this.destinations,
    required this.results,
    required this.total,
    required this.page,
    required this.totalPages,
    required this.params,
  });

  @override
  List<Object> get props =>
      [destinations, results, total, page, totalPages, params];
}

class SearchError extends SearchState {
  final String message;
  const SearchError(this.message);
  @override
  List<Object> get props => [message];
}
