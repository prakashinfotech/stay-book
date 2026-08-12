import 'dart:io';

import 'package:dartz/dartz.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/property_entity.dart';
import '../../domain/repositories/property_repository.dart';
import '../datasources/property_remote_datasource.dart';

class PropertyRepositoryImpl implements PropertyRepository {
  final PropertyRemoteDataSource _remoteDs;
  PropertyRepositoryImpl(this._remoteDs);

  @override
  Future<Either<Failure, PropertyEntity>> getById(String id) async {
    try {
      final model = await _remoteDs.getById(id);
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
