import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/destination_entity.dart';
import '../repositories/search_repository.dart';

class GetDestinationCountsUseCase {
  final SearchRepository _repository;
  GetDestinationCountsUseCase(this._repository);

  Future<Either<Failure, List<DestinationEntity>>> call() =>
      _repository.getDestinationCounts();
}
