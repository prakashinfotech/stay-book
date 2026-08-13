import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/property_entity.dart';

abstract class PropertyRepository {
  Future<Either<Failure, PropertyEntity>> getById(String id);
}
