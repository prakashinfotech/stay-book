import 'package:flutter/material.dart';

/// Light-mode palette tokens for the bento + gradient 3D theme.
class AppColorsLight {
  AppColorsLight._();

  static const Color primary50  = Color(0xFFEFF0FE);
  static const Color primary100 = Color(0xFFE0E1FE);
  static const Color primary200 = Color(0xFFC2C5FC);
  static const Color primary300 = Color(0xFFA5AAFA);
  static const Color primary400 = Color(0xFF7B82F2);
  static const Color primary500 = Color(0xFF6366F1);
  static const Color primary600 = Color(0xFF4F46E5);
  static const Color primary700 = Color(0xFF4338CA);
  static const Color primary800 = Color(0xFF3730A3);
  static const Color primary900 = Color(0xFF312E81);

  static const Color accent400  = Color(0xFFFCA5A5);
  static const Color accent500  = Color(0xFFF97066);
  static const Color accent600  = Color(0xFFEF4444);

  static const Color background      = Color(0xFFF6F4FB);
  static const Color surface         = Color(0xFFFFFFFF);
  static const Color surfaceElevated = Color(0xFFFAFAFC);
  static const Color text            = Color(0xFF0F172A);
  static const Color muted           = Color(0xFF64748B);
  static const Color border          = Color(0xFFE2E8F0);
  static const Color borderSubtle    = Color(0xFFF1F5F9);

  static const Color success = Color(0xFF10B981);
  static const Color danger  = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color star    = Color(0xFFF59E0B);

  static const Color shadow = Color(0x14000000); // ~8% black
}

/// Dark-mode palette tokens for the bento + gradient 3D theme.
class AppColorsDark {
  AppColorsDark._();

  static const Color primary50  = Color(0xFF1E1B4B);
  static const Color primary100 = Color(0xFF312E81);
  static const Color primary200 = Color(0xFF3730A3);
  static const Color primary300 = Color(0xFF4338CA);
  static const Color primary400 = Color(0xFF4F46E5);
  static const Color primary500 = Color(0xFF818CF8);
  static const Color primary600 = Color(0xFFA5B4FC);
  static const Color primary700 = Color(0xFFC7D2FE);
  static const Color primary800 = Color(0xFFE0E7FF);
  static const Color primary900 = Color(0xFFEEF2FF);

  static const Color accent400  = Color(0xFFFCA5A5);
  static const Color accent500  = Color(0xFFFCA5A5);
  static const Color accent600  = Color(0xFFFEE2E2);

  static const Color background      = Color(0xFF020617);
  static const Color surface         = Color(0xFF0F172A);
  static const Color surfaceElevated = Color(0xFF1E293B);
  static const Color text            = Color(0xFFF8FAFC);
  static const Color muted           = Color(0xFF94A3B8);
  static const Color border          = Color(0xFF1E293B);
  static const Color borderSubtle    = Color(0xFF1E293B);

  static const Color success = Color(0xFF34D399);
  static const Color danger  = Color(0xFFF87171);
  static const Color warning = Color(0xFFFBBF24);
  static const Color star    = Color(0xFFFBBF24);

  static const Color shadow = Color(0x66000000); // ~40% black
}

/// Backwards-compatible alias for code that still references the old AppColors.
/// Defaults to the light palette. Prefer using AppColorsLight or theme-aware
/// `Theme.of(context).colorScheme` going forward.
class AppColors {
  AppColors._();

  static const Color primary       = AppColorsLight.primary600;
  static const Color primaryDark   = AppColorsLight.primary700;
  static const Color accent        = AppColorsLight.accent500;
  static const Color accentHover   = AppColorsLight.accent600;
  static const Color background    = AppColorsLight.background;
  static const Color surface       = AppColorsLight.surface;
  static const Color text          = AppColorsLight.text;
  static const Color muted         = AppColorsLight.muted;
  static const Color star          = AppColorsLight.star;
  static const Color success       = AppColorsLight.success;
  static const Color danger        = AppColorsLight.danger;
  static const Color border        = AppColorsLight.border;
}
