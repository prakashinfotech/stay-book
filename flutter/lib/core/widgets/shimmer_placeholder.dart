import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class ShimmerPlaceholder extends StatelessWidget {
  const ShimmerPlaceholder({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 12,
    this.child,
  });

  final double? width;
  final double? height;
  final double borderRadius;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final base = scheme.surfaceContainerHighest;
    final highlight = scheme.outline.withValues(alpha: 0.30);

    return Shimmer.fromColors(
      baseColor: base,
      highlightColor: highlight,
      child: child ??
          Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              color: base,
              borderRadius: BorderRadius.circular(borderRadius),
            ),
          ),
    );
  }
}
