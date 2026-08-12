import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_radii.dart';
import 'app_text_styles.dart';

// Re-export legacy AppColors for existing callers that still import only
// `app_theme.dart`. New code should depend on `app_colors.dart` directly or
// read from Theme.of(context).colorScheme.
export 'app_colors.dart' show AppColors, AppColorsLight, AppColorsDark;

class AppTheme {
  AppTheme._();

  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark  => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    final scheme = ColorScheme(
      brightness: brightness,
      primary:        isDark ? AppColorsDark.primary500  : AppColorsLight.primary600,
      onPrimary:      Colors.white,
      primaryContainer: isDark ? AppColorsDark.primary100 : AppColorsLight.primary100,
      onPrimaryContainer: isDark ? AppColorsDark.primary800 : AppColorsLight.primary800,
      secondary:      isDark ? AppColorsDark.accent500   : AppColorsLight.accent500,
      onSecondary:    Colors.white,
      secondaryContainer: isDark ? AppColorsDark.accent400 : AppColorsLight.accent400,
      onSecondaryContainer: isDark ? AppColorsDark.text : AppColorsLight.text,
      tertiary:       isDark ? AppColorsDark.primary300  : AppColorsLight.primary400,
      onTertiary:     Colors.white,
      tertiaryContainer: isDark ? AppColorsDark.primary200 : AppColorsLight.primary200,
      onTertiaryContainer: isDark ? AppColorsDark.text : AppColorsLight.text,
      error:          isDark ? AppColorsDark.danger     : AppColorsLight.danger,
      onError:        Colors.white,
      surface:        isDark ? AppColorsDark.surface    : AppColorsLight.surface,
      onSurface:      isDark ? AppColorsDark.text       : AppColorsLight.text,
      surfaceContainerHighest: isDark ? AppColorsDark.surfaceElevated : AppColorsLight.surfaceElevated,
      onSurfaceVariant: isDark ? AppColorsDark.muted    : AppColorsLight.muted,
      outline:        isDark ? AppColorsDark.border     : AppColorsLight.border,
      outlineVariant: isDark ? AppColorsDark.borderSubtle : AppColorsLight.borderSubtle,
      shadow:         isDark ? AppColorsDark.shadow     : AppColorsLight.shadow,
      scrim:          Colors.black.withValues(alpha: 0.55),
      inverseSurface: isDark ? AppColorsLight.surface   : AppColorsDark.surface,
      onInverseSurface: isDark ? AppColorsLight.text    : AppColorsDark.text,
      inversePrimary: isDark ? AppColorsLight.primary600 : AppColorsDark.primary500,
    );

    final primary = scheme.primary;
    final muted   = isDark ? AppColorsDark.muted : AppColorsLight.muted;
    final border  = scheme.outline;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? AppColorsDark.background : AppColorsLight.background,
      textTheme: AppTextStyles.buildTextTheme(brightness),

      appBarTheme: AppBarTheme(
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: AppTextStyles.buildTextTheme(brightness).titleLarge,
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: scheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.button),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          elevation: 0,
          shadowColor: primary.withValues(alpha: 0.40),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: scheme.onSurface,
          side: BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.button),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surface,
        hintStyle: TextStyle(color: muted.withValues(alpha: 0.7)),
        labelStyle: TextStyle(color: muted, fontWeight: FontWeight.w500),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide(color: scheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide(color: scheme.error, width: 2),
        ),
      ),

      cardTheme: CardThemeData(
        color: scheme.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.card),
          side: BorderSide(color: border.withValues(alpha: 0.6)),
        ),
      ),

      dividerTheme: DividerThemeData(
        color: border.withValues(alpha: 0.7),
        thickness: 1,
        space: 1,
      ),

      chipTheme: ChipThemeData(
        backgroundColor: scheme.surfaceContainerHighest,
        side: BorderSide(color: border),
        labelStyle: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: scheme.onSurface,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.pill),
        ),
      ),

      progressIndicatorTheme: ProgressIndicatorThemeData(color: primary),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: scheme.inverseSurface,
        contentTextStyle: TextStyle(color: scheme.onInverseSurface),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
        ),
      ),

      tabBarTheme: TabBarThemeData(
        labelColor: primary,
        unselectedLabelColor: muted,
        labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
        indicator: UnderlineTabIndicator(
          borderSide: BorderSide(width: 3, color: primary),
          insets: const EdgeInsets.symmetric(horizontal: 12),
        ),
        indicatorSize: TabBarIndicatorSize.label,
      ),

      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: scheme.surface,
        selectedItemColor: primary,
        unselectedItemColor: muted,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
