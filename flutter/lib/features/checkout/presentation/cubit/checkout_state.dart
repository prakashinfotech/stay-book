part of 'checkout_cubit.dart';

abstract class CheckoutState extends Equatable {
  const CheckoutState();
}

class CheckoutInitial extends CheckoutState {
  const CheckoutInitial();
  @override
  List<Object?> get props => [];
}

class HoldLoading extends CheckoutState {
  const HoldLoading();
  @override
  List<Object?> get props => [];
}

class HoldReady extends CheckoutState {
  final String holdId;
  final DateTime expiresAt;
  const HoldReady({required this.holdId, required this.expiresAt});
  @override
  List<Object?> get props => [holdId, expiresAt];
}

class BookingLoading extends CheckoutState {
  const BookingLoading();
  @override
  List<Object?> get props => [];
}

class BookingSuccess extends CheckoutState {
  final BookingEntity booking;
  const BookingSuccess(this.booking);
  @override
  List<Object?> get props => [booking];
}

class CheckoutError extends CheckoutState {
  final String message;
  const CheckoutError(this.message);
  @override
  List<Object?> get props => [message];
}

class PaymentOrderLoading extends CheckoutState {
  const PaymentOrderLoading();
  @override
  List<Object?> get props => [];
}

class PaymentOrderReady extends CheckoutState {
  final String orderId;
  final int amount; // paise, passed directly to Razorpay.open()
  final String currency;
  final String keyId;

  const PaymentOrderReady({
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.keyId,
  });

  @override
  List<Object?> get props => [orderId, amount, currency, keyId];
}
