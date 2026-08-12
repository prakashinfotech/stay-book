import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_gradients.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    context.read<AuthBloc>().add(const AppStarted());
  }

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final scheme = theme.colorScheme;

    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          context.goNamed('home');
        } else if (state is AuthUnauthenticated) {
          context.goNamed('login');
        }
      },
      child: Scaffold(
        body: DecoratedBox(
          decoration: BoxDecoration(gradient: AppGradients.heroMesh(theme.brightness)),
          child: SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      gradient: AppGradients.primaryButton(theme.brightness),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: scheme.primary.withValues(alpha: 0.45),
                          blurRadius: 32,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text(
                        'S',
                        style: TextStyle(
                          fontSize: 52,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  )
                      .animate()
                      .scaleXY(begin: 0.6, end: 1.0, duration: 600.ms, curve: Curves.easeOutBack)
                      .fadeIn(duration: 400.ms),
                  const SizedBox(height: 28),
                  Text(
                    'StayBook',
                    style: theme.textTheme.displayMedium?.copyWith(
                      color: scheme.onSurface,
                      letterSpacing: -0.4,
                    ),
                  )
                      .animate()
                      .slideY(begin: 0.2, end: 0, delay: 200.ms, duration: 400.ms, curve: Curves.easeOutCubic)
                      .fadeIn(delay: 200.ms, duration: 400.ms),
                  const SizedBox(height: 8),
                  Text(
                    'Find your perfect stay',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 400.ms, duration: 400.ms),
                  const SizedBox(height: 48),
                  SizedBox(
                    width: 26,
                    height: 26,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation(scheme.primary),
                    ),
                  ).animate().fadeIn(delay: 500.ms, duration: 400.ms),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
