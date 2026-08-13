import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/destination_entity.dart';
import '../../domain/entities/search_result_entity.dart';
import '../../domain/usecases/get_destination_counts_usecase.dart';
import '../../domain/usecases/get_featured_properties_usecase.dart';
import '../../domain/usecases/search_properties_usecase.dart';
import 'search_event.dart';
import 'search_state.dart';

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  final GetDestinationCountsUseCase _getDestinations;
  final SearchPropertiesUseCase _searchProperties;
  final GetFeaturedPropertiesUseCase _getFeatured;

  List<DestinationEntity> _cachedDestinations = [];
  List<SearchResultEntity> _cachedFeatured = [];

  SearchBloc({
    required GetDestinationCountsUseCase getDestinations,
    required SearchPropertiesUseCase searchProperties,
    required GetFeaturedPropertiesUseCase getFeatured,
  })  : _getDestinations = getDestinations,
        _searchProperties = searchProperties,
        _getFeatured = getFeatured,
        super(const SearchInitial()) {
    on<SearchInitialised>(_onInitialised);
    on<SearchSubmitted>(_onSubmitted);
    on<SearchReset>(_onReset);
  }

  Future<void> _onInitialised(
    SearchInitialised event,
    Emitter<SearchState> emit,
  ) async {
    if (_cachedDestinations.isNotEmpty) {
      emit(SearchHomeLoaded(_cachedDestinations, featured: _cachedFeatured));
      return;
    }
    emit(const SearchLoading());
    try {
      final results = await Future.wait([
        _getDestinations(),
        _getFeatured(),
      ]);
      final destResult = results[0] as dynamic;
      final featResult = results[1] as dynamic;
      if (destResult.isLeft()) {
        emit(SearchError((destResult as dynamic).fold((f) => f.message, (_) => '')));
        return;
      }
      _cachedDestinations = destResult.getOrElse(() => <DestinationEntity>[]) as List<DestinationEntity>;
      _cachedFeatured = featResult.getOrElse(() => <SearchResultEntity>[]) as List<SearchResultEntity>;
      emit(SearchHomeLoaded(_cachedDestinations, featured: _cachedFeatured));
    } catch (e) {
      emit(SearchError("An unexpected error occurred: $e"));
    }
  }

  Future<void> _onSubmitted(
    SearchSubmitted event,
    Emitter<SearchState> emit,
  ) async {
    emit(const SearchLoading());
    final result = await _searchProperties(event.params);
    result.fold(
      (failure) => emit(SearchError(failure.message)),
      (page) => emit(
        SearchResultsLoaded(
          destinations: _cachedDestinations,
          results: page.results,
          total: page.total,
          page: page.page,
          totalPages: page.totalPages,
          params: event.params,
        ),
      ),
    );
  }

  void _onReset(SearchReset event, Emitter<SearchState> emit) {
    emit(SearchHomeLoaded(_cachedDestinations, featured: _cachedFeatured));
  }
}
