import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/errors/failures.dart';
import '../entities/booking_entity.dart';
import '../repositories/checkout_repository.dart';

class BookingParams extends Equatable {
  final String holdId;
  final String? ratePlanId;
  final int adults;
  final int children;
  final Map<String, dynamic> guestDetails;
  final Map<String, dynamic> payment;

  const BookingParams({
    required this.holdId,
    this.ratePlanId,
    required this.adults,
    required this.children,
    required this.guestDetails,
    required this.payment,
  });

  @override
  List<Object?> get props => [holdId, ratePlanId, adults, children, guestDetails, payment];
}

class CreateBookingUseCase {
  final CheckoutRepository _repository;
  const CreateBookingUseCase(this._repository);

  Future<Either<Failure, BookingEntity>> call(BookingParams params) =>
      _repository.createBooking(
        holdId: params.holdId,
        ratePlanId: params.ratePlanId,
        adults: params.adults,
        children: params.children,
        guestDetails: params.guestDetails,
        payment: params.payment,
      );
}
