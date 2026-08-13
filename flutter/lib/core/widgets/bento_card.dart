import 'package:flutter/material.dart';
import '../theme/app_radii.dart';
import '../theme/app_shadows.dart';

/// The core surface for the bento + gradient 3D theme.
///
/// Use this in place of `Container` for any panel that holds content. It
/// renders a rounded surface with a layered soft shadow and an optional
/// gradient or border.
class BentoCard extends StatelessWidget {
  const BentoCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.radius,
    this.gradient,
    this.borderColor,
    this.elevated = false,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double? radius;
  final Gradient? gradient;
  final Color? borderColor;
  final bool elevated;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme   = Theme.of(context);
    final scheme  = theme.colorScheme;
    final r       = radius ?? AppRadii.card;
    final border  = borderColor ?? scheme.outline.withValues(alpha: 0.6);

    final decoration = BoxDecoration(
      color: gradient == null ? scheme.surface : null,
      gradient: gradient,
      borderRadius: BorderRadius.circular(r),
      border: Border.all(color: border, width: 1),
      boxShadow: elevated
          ? AppShadows.card(theme.brightness)
          : AppShadows.soft(theme.brightness),
    );

    final content = AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      margin: margin,
      decoration: decoration,
      child: Padding(padding: padding, child: child),
    );

    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(r),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(r),
        child: content,
      ),
    );
  }
}
