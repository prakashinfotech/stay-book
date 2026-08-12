import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/search_result_entity.dart';
import '../repositories/search_repository.dart';

class GetFeaturedPropertiesUseCase {
  final SearchRepository _repository;
  const GetFeaturedPropertiesUseCase(this._repository);

  Future<Either<Failure, List<SearchResultEntity>>> call() =>
      _repository.getFeaturedProperties();
}
