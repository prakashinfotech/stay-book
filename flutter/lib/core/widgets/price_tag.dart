import 'package:flutter/material.dart';
import '../theme/app_gradients.dart';
import '../theme/app_radii.dart';

/// Gradient pill used for prominent prices.
class PriceTag extends StatelessWidget {
  const PriceTag({
    super.key,
    required this.label,
    this.suffix,
    this.padding = const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
  });

  final String label;
  final String? suffix;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        gradient: AppGradients.priceTag(theme.brightness),
        borderRadius: BorderRadius.circular(AppRadii.pill),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withValues(alpha: 0.30),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: 0.2,
            ),
          ),
          if (suffix != null) ...[
            const SizedBox(width: 4),
            Text(
              suffix!,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.85),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
