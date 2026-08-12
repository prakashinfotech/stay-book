import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/booking_list_item_entity.dart';
import '../repositories/trips_repository.dart';

class GetMyBookingsUseCase {
  final TripsRepository _repository;
  const GetMyBookingsUseCase(this._repository);

  Future<Either<Failure, List<BookingListItemEntity>>> call() =>
      _repository.getMyBookings();
}
