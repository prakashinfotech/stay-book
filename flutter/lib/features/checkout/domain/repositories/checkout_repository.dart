import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/booking_entity.dart';
import '../entities/hold_result_entity.dart';
import '../entities/payment_order_entity.dart';

abstract class CheckoutRepository {
  Future<Either<Failure, HoldResultEntity>> createHold({
    required String roomTypeId,
    required String propertyId,
    required String checkin,
    required String checkout,
    required int adults,
    required int children,
  });

  Future<Either<Failure, BookingEntity>> createBooking({
    required String holdId,
    String? ratePlanId,
    required int adults,
    required int children,
    required Map<String, dynamic> guestDetails,
    required Map<String, dynamic> payment,
  });

  Future<Either<Failure, PaymentOrderEntity>> createPaymentOrder({
    required double amountInRupees,
    required String holdId,
  });
}
