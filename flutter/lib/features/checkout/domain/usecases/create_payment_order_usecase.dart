import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/errors/failures.dart';
import '../entities/payment_order_entity.dart';
import '../repositories/checkout_repository.dart';

class PaymentOrderParams extends Equatable {
  final double amountInRupees; // server expects rupees, converts to paise internally
  final String holdId;

  const PaymentOrderParams({
    required this.amountInRupees,
    required this.holdId,
  });

  @override
  List<Object?> get props => [amountInRupees, holdId];
}

class CreatePaymentOrderUseCase {
  final CheckoutRepository _repository;
  const CreatePaymentOrderUseCase(this._repository);

  Future<Either<Failure, PaymentOrderEntity>> call(PaymentOrderParams params) =>
      _repository.createPaymentOrder(
        amountInRupees: params.amountInRupees,
        holdId: params.holdId,
      );
}
