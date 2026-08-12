import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/booking_list_item_entity.dart';

abstract class TripsRepository {
  Future<Either<Failure, List<BookingListItemEntity>>> getMyBookings({
    int page = 1,
    int limit = 50,
  });

  Future<Either<Failure, BookingListItemEntity>> cancelBooking(String id);
}
