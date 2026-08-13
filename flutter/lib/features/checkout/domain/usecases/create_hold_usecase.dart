import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/errors/failures.dart';
import '../entities/hold_result_entity.dart';
import '../repositories/checkout_repository.dart';

class HoldParams extends Equatable {
  final String roomTypeId;
  final String propertyId;
  final String checkin;
  final String checkout;
  final int adults;
  final int children;

  const HoldParams({
    required this.roomTypeId,
    required this.propertyId,
    required this.checkin,
    required this.checkout,
    required this.adults,
    required this.children,
  });

  @override
  List<Object?> get props => [roomTypeId, propertyId, checkin, checkout, adults, children];
}

class CreateHoldUseCase {
  final CheckoutRepository _repository;
  const CreateHoldUseCase(this._repository);

  Future<Either<Failure, HoldResultEntity>> call(HoldParams params) =>
      _repository.createHold(
        roomTypeId: params.roomTypeId,
        propertyId: params.propertyId,
        checkin: params.checkin,
        checkout: params.checkout,
        adults: params.adults,
        children: params.children,
      );
}
