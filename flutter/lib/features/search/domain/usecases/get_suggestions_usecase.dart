import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/search_repository.dart';

class GetSuggestionsUseCase {
  final SearchRepository _repository;
  GetSuggestionsUseCase(this._repository);

  Future<Either<Failure, List<String>>> call(String q) =>
      _repository.getSuggestions(q);
}
