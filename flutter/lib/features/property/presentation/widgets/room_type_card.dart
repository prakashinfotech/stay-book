import 'package:flutter/material.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/theme/app_radii.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../domain/entities/property_entity.dart';

class RoomTypeCard extends StatelessWidget {
  final RoomTypeEntity roomType;
  final VoidCallback onReserve;

  const RoomTypeCard({
    super.key,
    required this.roomType,
    required this.onReserve,
  });

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(AppRadii.card),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  roomType.name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.person_outline,
                      size: 14, color: AppColors.muted),
                  const SizedBox(width: 3),
                  Text(
                    'Up to ${roomType.maxOccupancy}',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.muted),
                  ),
                ],
              ),
            ],
          ),
          if (roomType.description != null) ...[
            const SizedBox(height: 4),
            Text(
              roomType.description!,
              style: const TextStyle(fontSize: 12, color: AppColors.muted),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              _badge(
                roomType.mealPlan == 'BREAKFAST'
                    ? 'Breakfast incl.'
                    : 'No meals',
                roomType.mealPlan == 'BREAKFAST'
                    ? AppColors.success
                    : AppColors.muted,
              ),
              const SizedBox(width: 8),
              _badge(
                roomType.cancellationPolicy == 'FLEXIBLE'
                    ? 'Free cancellation'
                    : 'Non-refundable',
                roomType.cancellationPolicy == 'FLEXIBLE'
                    ? AppColors.success
                    : AppColors.danger,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    formatInr(roomType.basePrice),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  const Text(
                    'per night',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                ],
              ),
              Container(
                height: 40,
                decoration: BoxDecoration(
                  gradient: AppGradients.priceTag(theme.brightness),
                  borderRadius: BorderRadius.circular(AppRadii.md),
                  boxShadow: [
                    BoxShadow(
                      color: scheme.primary.withValues(alpha: 0.30),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(AppRadii.md),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(AppRadii.md),
                    onTap: onReserve,
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      child: Text(
                        'Reserve',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}
