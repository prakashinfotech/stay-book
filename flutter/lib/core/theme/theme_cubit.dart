import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ThemeCubit extends Cubit<ThemeMode> {
  ThemeCubit(this._storage) : super(ThemeMode.system) {
    _hydrate();
  }

  final FlutterSecureStorage _storage;
  static const _key = 'theme_mode';

  Future<void> _hydrate() async {
    final raw = await _storage.read(key: _key);
    switch (raw) {
      case 'light':
        emit(ThemeMode.light);
      case 'dark':
        emit(ThemeMode.dark);
      case 'system':
      default:
        emit(ThemeMode.system);
    }
  }

  Future<void> setMode(ThemeMode mode) async {
    emit(mode);
    final raw = mode == ThemeMode.light
        ? 'light'
        : mode == ThemeMode.dark
            ? 'dark'
            : 'system';
    await _storage.write(key: _key, value: raw);
  }

  Future<void> toggle(Brightness platformBrightness) async {
    // System mode toggles to the OPPOSITE of what's currently rendering.
    if (state == ThemeMode.system) {
      await setMode(
        platformBrightness == Brightness.dark ? ThemeMode.light : ThemeMode.dark,
      );
      return;
    }
    await setMode(state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark);
  }
}
