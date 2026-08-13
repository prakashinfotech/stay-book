import 'dart:io';
import 'package:dartz/dartz.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/booking_list_item_entity.dart';
import '../../domain/repositories/trips_repository.dart';
import '../datasources/trips_remote_datasource.dart';

class TripsRepositoryImpl implements TripsRepository {
  final TripsRemoteDataSource _remoteDs;
  const TripsRepositoryImpl(this._remoteDs);

  @override
  Future<Either<Failure, List<BookingListItemEntity>>> getMyBookings({
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final models = await _remoteDs.getMyBookings(page: page, limit: limit);
      return Right(models.map((m) => m.toEntity()).toList());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, BookingListItemEntity>> cancelBooking(String id) async {
    try {
      final model = await _remoteDs.cancelBooking(id);
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }
}
