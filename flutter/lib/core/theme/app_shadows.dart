import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Layered shadow presets that produce a soft 3D depth effect.
/// Each accessor accepts the current Brightness so dark mode gets stronger,
/// darker shadows for the same perceived depth.
class AppShadows {
  AppShadows._();

  static Color _base(Brightness b) =>
      b == Brightness.dark ? AppColorsDark.shadow : AppColorsLight.shadow;

  static List<BoxShadow> soft(Brightness b) => [
        BoxShadow(
          color: _base(b).withValues(alpha: 0.04),
          blurRadius: 4,
          offset: const Offset(0, 1),
        ),
        BoxShadow(
          color: _base(b).withValues(alpha: 0.06),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> card(Brightness b) => [
        BoxShadow(
          color: _base(b).withValues(alpha: 0.06),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
        BoxShadow(
          color: _base(b).withValues(alpha: 0.10),
          blurRadius: 18,
          offset: const Offset(0, 8),
        ),
      ];

  static List<BoxShadow> lift(Brightness b) => [
        BoxShadow(
          color: _base(b).withValues(alpha: 0.10),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
        BoxShadow(
          color: _base(b).withValues(alpha: 0.18),
          blurRadius: 36,
          offset: const Offset(0, 18),
        ),
      ];

  /// Primary-colour glow used for active CTAs and focused inputs.
  static List<BoxShadow> glow(Color tint, {double alpha = 0.30}) => [
        BoxShadow(
          color: tint.withValues(alpha: alpha),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
      ];
}
