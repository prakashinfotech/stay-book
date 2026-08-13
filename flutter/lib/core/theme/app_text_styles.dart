import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Builds the typography for the StayBook bento + 3D theme.
///
///  - Display / Headline use Plus Jakarta Sans for a premium editorial feel.
///  - Title / Body / Label use Inter for high legibility at small sizes.
class AppTextStyles {
  AppTextStyles._();

  static TextTheme buildTextTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final primary = isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final muted   = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final display = GoogleFonts.plusJakartaSansTextTheme(
      const TextTheme(
        displayLarge:  TextStyle(fontSize: 36, fontWeight: FontWeight.w800, letterSpacing: -0.5),
        displayMedium: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, letterSpacing: -0.4),
        displaySmall:  TextStyle(fontSize: 26, fontWeight: FontWeight.w700, letterSpacing: -0.3),
        headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.2),
        headlineMedium:TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        headlineSmall: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
      ),
    );

    final body = GoogleFonts.interTextTheme(
      const TextTheme(
        titleLarge:    TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        titleMedium:   TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        titleSmall:    TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        bodyLarge:     TextStyle(fontSize: 15, fontWeight: FontWeight.w400, height: 1.45),
        bodyMedium:    TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 1.45),
        bodySmall:     TextStyle(fontSize: 12, fontWeight: FontWeight.w400, height: 1.4),
        labelLarge:    TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        labelMedium:   TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        labelSmall:    TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5),
      ),
    );

    return TextTheme(
      displayLarge:  display.displayLarge?.copyWith(color: primary),
      displayMedium: display.displayMedium?.copyWith(color: primary),
      displaySmall:  display.displaySmall?.copyWith(color: primary),
      headlineLarge: display.headlineLarge?.copyWith(color: primary),
      headlineMedium:display.headlineMedium?.copyWith(color: primary),
      headlineSmall: display.headlineSmall?.copyWith(color: primary),
      titleLarge:    body.titleLarge?.copyWith(color: primary),
      titleMedium:   body.titleMedium?.copyWith(color: primary),
      titleSmall:    body.titleSmall?.copyWith(color: primary),
      bodyLarge:     body.bodyLarge?.copyWith(color: primary),
      bodyMedium:    body.bodyMedium?.copyWith(color: primary),
      bodySmall:     body.bodySmall?.copyWith(color: muted),
      labelLarge:    body.labelLarge?.copyWith(color: primary),
      labelMedium:   body.labelMedium?.copyWith(color: primary),
      labelSmall:    body.labelSmall?.copyWith(color: muted),
    );
  }

  /// Legacy compatibility shim — kept so old imports still resolve.
  /// Prefer `Theme.of(context).textTheme` in new code.
  static TextTheme get textTheme => buildTextTheme(Brightness.light);
}
