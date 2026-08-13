import '../../domain/entities/payment_order_entity.dart';

class PaymentOrderModel {
  final String orderId;
  final int amount;
  final String currency;
  final String keyId;

  const PaymentOrderModel({
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.keyId,
  });

  factory PaymentOrderModel.fromJson(Map<String, dynamic> json) {
    return PaymentOrderModel(
      orderId: json['orderId'] as String,
      amount: (json['amount'] as num).toInt(), // server returns int paise
      currency: json['currency'] as String,
      keyId: json['keyId'] as String,
    );
  }

  PaymentOrderEntity toEntity() => PaymentOrderEntity(
        orderId: orderId,
        amount: amount,
        currency: currency,
        keyId: keyId,
      );
}
