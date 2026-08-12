import '../../domain/entities/destination_entity.dart';

class DestinationModel {
  final String city;
  final int count;

  const DestinationModel({required this.city, required this.count});

  factory DestinationModel.fromJson(Map<String, dynamic> json) =>
      DestinationModel(
        city: json['city'] as String,
        count: (json['count'] as num).toInt(),
      );

  DestinationEntity toEntity() => DestinationEntity(city: city, count: count);
}
