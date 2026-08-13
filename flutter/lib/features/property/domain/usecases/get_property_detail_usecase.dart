import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/property_entity.dart';
import '../repositories/property_repository.dart';

class GetPropertyDetailUseCase {
  final PropertyRepository _repository;
  GetPropertyDetailUseCase(this._repository);

  Future<Either<Failure, PropertyEntity>> call(String id) =>
      _repository.getById(id);
}
