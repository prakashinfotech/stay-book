import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_cubit.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'injection_container.dart';

class StayBookApp extends StatefulWidget {
  const StayBookApp({super.key});

  @override
  State<StayBookApp> createState() => _StayBookAppState();
}

class _StayBookAppState extends State<StayBookApp> {
  late final _router = buildAppRouter();

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>.value(value: sl<AuthBloc>()),
        BlocProvider<ThemeCubit>.value(value: sl<ThemeCubit>()),
      ],
      child: BlocBuilder<ThemeCubit, ThemeMode>(
        builder: (context, themeMode) {
          return MaterialApp.router(
            title: 'StayBook',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: themeMode,
            routerConfig: _router,
          );
        },
      ),
    );
  }
}
