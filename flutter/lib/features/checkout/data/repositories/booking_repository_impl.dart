import 'dart:io';
import 'package:dartz/dartz.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/entities/hold_result_entity.dart';
import '../../domain/entities/payment_order_entity.dart';
import '../../domain/repositories/checkout_repository.dart';
import '../datasources/booking_remote_datasource.dart';

class BookingRepositoryImpl implements CheckoutRepository {
  final BookingRemoteDataSource _remoteDs;
  const BookingRepositoryImpl(this._remoteDs);

  @override
  Future<Either<Failure, HoldResultEntity>> createHold({
    required String roomTypeId,
    required String propertyId,
    required String checkin,
    required String checkout,
    required int adults,
    required int children,
  }) async {
    try {
      final model = await _remoteDs.createHold(
        roomTypeId: roomTypeId,
        propertyId: propertyId,
        checkin: checkin,
        checkout: checkout,
        adults: adults,
        children: children,
      );
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, BookingEntity>> createBooking({
    required String holdId,
    String? ratePlanId,
    required int adults,
    required int children,
    required Map<String, dynamic> guestDetails,
    required Map<String, dynamic> payment,
  }) async {
    try {
      final model = await _remoteDs.createBooking(
        holdId: holdId,
        ratePlanId: ratePlanId,
        adults: adults,
        children: children,
        guestDetails: guestDetails,
        payment: payment,
      );
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, PaymentOrderEntity>> createPaymentOrder({
    required double amountInRupees,
    required String holdId,
  }) async {
    try {
      final model = await _remoteDs.createPaymentOrder(
        amountInRupees: amountInRupees,
        holdId: holdId,
      );
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }
}
