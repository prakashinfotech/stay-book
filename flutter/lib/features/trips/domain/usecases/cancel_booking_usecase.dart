import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/booking_list_item_entity.dart';
import '../repositories/trips_repository.dart';

class CancelBookingUseCase {
  final TripsRepository _repository;
  const CancelBookingUseCase(this._repository);

  Future<Either<Failure, BookingListItemEntity>> call(String id) =>
      _repository.cancelBooking(id);
}
