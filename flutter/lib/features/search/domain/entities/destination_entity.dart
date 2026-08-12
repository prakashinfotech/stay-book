import 'package:equatable/equatable.dart';

class DestinationEntity extends Equatable {
  final String city;
  final int count;
  const DestinationEntity({required this.city, required this.count});
  @override
  List<Object> get props => [city, count];
}
