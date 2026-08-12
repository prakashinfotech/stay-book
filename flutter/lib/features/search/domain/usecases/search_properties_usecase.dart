import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/search_params.dart';
import '../repositories/search_repository.dart';

class SearchPropertiesUseCase {
  final SearchRepository _repository;
  SearchPropertiesUseCase(this._repository);

  Future<Either<Failure, SearchPage>> call(SearchParams params) =>
      _repository.searchProperties(params);
}
