import 'package:equatable/equatable.dart';

class PaymentOrderEntity extends Equatable {
  final String orderId;
  final int amount; // in paise, as returned by server
  final String currency;
  final String keyId;

  const PaymentOrderEntity({
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.keyId,
  });

  @override
  List<Object?> get props => [orderId, amount, currency, keyId];
}
