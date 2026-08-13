import 'dart:ui';

import 'package:flutter/material.dart';
import '../theme/app_gradients.dart';
import '../theme/app_radii.dart';
import '../theme/app_shadows.dart';

/// Frosted-glass surface for hero overlays and sticky panels.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.radius,
    this.blur = 18,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double? radius;
  final double blur;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final r = radius ?? AppRadii.card;
    final borderColor = theme.brightness == Brightness.dark
        ? Colors.white.withValues(alpha: 0.10)
        : Colors.white.withValues(alpha: 0.30);

    return ClipRRect(
      borderRadius: BorderRadius.circular(r),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            gradient: AppGradients.cardGlass(theme.brightness),
            borderRadius: BorderRadius.circular(r),
            border: Border.all(color: borderColor),
            boxShadow: AppShadows.card(theme.brightness),
          ),
          padding: padding,
          child: child,
        ),
      ),
    );
  }
}
