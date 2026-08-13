import 'package:flutter/material.dart';
import '../theme/app_gradients.dart';

/// A SliverAppBar with a mesh-gradient flexibleSpace background.
///
/// Use inside a CustomScrollView as the first sliver to create a hero header.
class GradientSliverAppBar extends StatelessWidget {
  const GradientSliverAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.expandedHeight = 220,
    this.actions,
    this.pinned = true,
    this.collapsedTitle,
  });

  final String title;
  final String? subtitle;
  final double expandedHeight;
  final List<Widget>? actions;
  final bool pinned;
  final String? collapsedTitle;

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final scheme = theme.colorScheme;

    return SliverAppBar(
      pinned: pinned,
      expandedHeight: expandedHeight,
      backgroundColor: scheme.surface,
      foregroundColor: scheme.onSurface,
      elevation: 0,
      title: collapsedTitle != null ? Text(collapsedTitle!) : null,
      actions: actions,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: AppGradients.heroMesh(theme.brightness),
              ),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    scheme.surface.withValues(alpha: 0.95),
                    scheme.surface.withValues(alpha: 0.0),
                  ],
                  stops: const [0.0, 0.4],
                ),
              ),
            ),
            Positioned(
              left: 20,
              right: 20,
              bottom: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.displaySmall?.copyWith(
                      color: scheme.onSurface,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      subtitle!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
