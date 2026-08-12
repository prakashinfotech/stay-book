import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

const _amenityIcons = <String, IconData>{
  'wifi': Icons.wifi,
  'pool': Icons.pool,
  'parking': Icons.local_parking,
  'gym': Icons.fitness_center,
  'spa': Icons.spa,
  'restaurant': Icons.restaurant,
  'bar': Icons.local_bar,
  'ac': Icons.ac_unit,
  'tv': Icons.tv,
  'kitchen': Icons.kitchen,
  'laundry': Icons.local_laundry_service,
  'elevator': Icons.elevator,
  'concierge': Icons.room_service,
  'airport': Icons.flight,
  'beach': Icons.beach_access,
};

IconData _iconFor(String amenity) {
  final key = amenity.toLowerCase();
  for (final entry in _amenityIcons.entries) {
    if (key.contains(entry.key)) return entry.value;
  }
  return Icons.check_circle_outline;
}

class AmenityChip extends StatelessWidget {
  final String label;
  const AmenityChip({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_iconFor(label), size: 14, color: AppColors.primary),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.text,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
