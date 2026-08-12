import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Reusable gradient presets for the bento + gradient 3D theme.
class AppGradients {
  AppGradients._();

  /// Mesh-style hero gradient — drop into a Container.decoration as a
  /// background, then overlay a translucent surface on top of it.
  static LinearGradient heroMesh(Brightness b) {
    final isDark = b == Brightness.dark;
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: isDark
          ? const [
              Color(0xFF1E1B4B),
              Color(0xFF312E81),
              Color(0xFF7C2D12),
            ]
          : const [
              Color(0xFFE0E7FF),
              Color(0xFFFCE7F3),
              Color(0xFFFFEDD5),
            ],
    );
  }

  static LinearGradient primaryButton(Brightness b) {
    final base = b == Brightness.dark
        ? AppColorsDark.primary400
        : AppColorsLight.primary500;
    final tone = b == Brightness.dark
        ? AppColorsDark.primary300
        : AppColorsLight.primary700;
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [base, tone],
    );
  }

  static LinearGradient accentButton(Brightness b) {
    final base = b == Brightness.dark
        ? AppColorsDark.accent400
        : AppColorsLight.accent400;
    final tone = b == Brightness.dark
        ? AppColorsDark.accent600
        : AppColorsLight.accent600;
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [base, tone],
    );
  }

  static LinearGradient cardGlass(Brightness b) {
    final isDark = b == Brightness.dark;
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: isDark
          ? [
              const Color(0xFF1E293B).withValues(alpha: 0.72),
              const Color(0xFF0F172A).withValues(alpha: 0.56),
            ]
          : [
              Colors.white.withValues(alpha: 0.78),
              Colors.white.withValues(alpha: 0.62),
            ],
    );
  }

  /// Gradient used for price tags / pills.
  static LinearGradient priceTag(Brightness b) {
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: b == Brightness.dark
          ? const [Color(0xFF818CF8), Color(0xFFFCA5A5)]
          : const [Color(0xFF4F46E5), Color(0xFFF97066)],
    );
  }
}
