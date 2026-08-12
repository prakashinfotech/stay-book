import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_gradients.dart';
import '../theme/app_radii.dart';
import '../theme/app_shadows.dart';

/// Primary call-to-action button with a gradient fill and soft glow.
///
/// Animates on press for tactile feedback. Falls back to a solid colour if
/// [gradient] is overridden to `null`.
class GradientButton extends StatelessWidget {
  const GradientButton({
    super.key,
    required this.onPressed,
    required this.label,
    this.icon,
    this.loading = false,
    this.gradient,
    this.fullWidth = true,
    this.height = 52,
  });

  final VoidCallback? onPressed;
  final String label;
  final IconData? icon;
  final bool loading;
  final LinearGradient? gradient;
  final bool fullWidth;
  final double height;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final disabled = onPressed == null || loading;

    final g = gradient ?? AppGradients.primaryButton(theme.brightness);

    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: height,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: disabled ? 0.65 : 1,
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadii.md),
          child: InkWell(
            onTap: disabled ? null : onPressed,
            borderRadius: BorderRadius.circular(AppRadii.md),
            child: Ink(
              decoration: BoxDecoration(
                gradient: g,
                borderRadius: BorderRadius.circular(AppRadii.md),
                boxShadow: disabled
                    ? null
                    : AppShadows.glow(g.colors.first, alpha: 0.35),
              ),
              child: Center(
                child: loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation(Colors.white),
                        ),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (icon != null) ...[
                            Icon(icon, size: 18, color: scheme.onPrimary),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            label,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: scheme.onPrimary,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    ).animate(target: disabled ? 0 : 1).scaleXY(
          begin: 0.985,
          end: 1.0,
          duration: 220.ms,
          curve: Curves.easeOutCubic,
        );
  }
}
