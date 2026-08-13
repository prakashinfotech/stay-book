import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/usecases/create_booking_usecase.dart';
import '../../domain/usecases/create_hold_usecase.dart';
import '../../domain/usecases/create_payment_order_usecase.dart';

part 'checkout_state.dart';

class CheckoutCubit extends Cubit<CheckoutState> {
  final CreateHoldUseCase _createHold;
  final CreateBookingUseCase _createBooking;
  final CreatePaymentOrderUseCase _createPaymentOrder;

  CheckoutCubit(this._createHold, this._createBooking, this._createPaymentOrder)
      : super(const CheckoutInitial());

  Future<void> createHold({
    required String roomTypeId,
    required String propertyId,
    required String checkin,
    required String checkout,
    required int adults,
    required int children,
  }) async {
    emit(const HoldLoading());
    final result = await _createHold(HoldParams(
      roomTypeId: roomTypeId,
      propertyId: propertyId,
      checkin: checkin,
      checkout: checkout,
      adults: adults,
      children: children,
    ));
    result.fold(
      (failure) => emit(CheckoutError(failure.message)),
      (hold) => emit(HoldReady(holdId: hold.id, expiresAt: hold.expiresAt)),
    );
  }

  Future<void> submitBooking({
    required String holdId,
    String? ratePlanId,
    required int adults,
    required int children,
    required Map<String, dynamic> guestDetails,
    required Map<String, dynamic> payment,
  }) async {
    emit(const BookingLoading());
    final result = await _createBooking(BookingParams(
      holdId: holdId,
      ratePlanId: ratePlanId,
      adults: adults,
      children: children,
      guestDetails: guestDetails,
      payment: payment,
    ));
    result.fold(
      (failure) => emit(CheckoutError(failure.message)),
      (booking) => emit(BookingSuccess(booking)),
    );
  }

  Future<void> createPaymentOrder({
    required double totalPriceInRupees,
    required String holdId,
  }) async {
    emit(const PaymentOrderLoading());
    final result = await _createPaymentOrder(PaymentOrderParams(
      amountInRupees: totalPriceInRupees,
      holdId: holdId,
    ));
    result.fold(
      (failure) => emit(CheckoutError(failure.message)),
      (order) => emit(PaymentOrderReady(
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
      )),
    );
  }
}
