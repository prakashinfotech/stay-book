import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../theme/theme_cubit.dart';

class ThemeToggleTile extends StatelessWidget {
  const ThemeToggleTile({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return BlocBuilder<ThemeCubit, ThemeMode>(
      builder: (context, mode) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
              child: Text(
                'Appearance',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ),
            SegmentedButton<ThemeMode>(
              segments: const [
                ButtonSegment(value: ThemeMode.light,  label: Text('Light'),  icon: Icon(Icons.light_mode_outlined)),
                ButtonSegment(value: ThemeMode.system, label: Text('Auto'),   icon: Icon(Icons.brightness_auto_outlined)),
                ButtonSegment(value: ThemeMode.dark,   label: Text('Dark'),   icon: Icon(Icons.dark_mode_outlined)),
              ],
              selected: {mode},
              onSelectionChanged: (s) {
                context.read<ThemeCubit>().setMode(s.first);
              },
              showSelectedIcon: false,
            ),
          ],
        );
      },
    );
  }
}
