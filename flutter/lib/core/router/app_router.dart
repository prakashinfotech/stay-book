import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/bloc/auth_state.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/otp_page.dart';
import '../../features/auth/presentation/pages/profile_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/checkout/domain/entities/booking_entity.dart';
import '../../features/trips/domain/entities/booking_list_item_entity.dart';
import '../../features/trips/presentation/bloc/trips_bloc.dart';
import '../../features/trips/presentation/pages/trip_detail_page.dart';
import '../../features/trips/presentation/pages/trips_page.dart';
import '../../features/checkout/presentation/cubit/checkout_cubit.dart';
import '../../features/checkout/presentation/pages/confirmation_page.dart';
import '../../features/checkout/presentation/pages/guest_details_page.dart';
import '../../features/checkout/presentation/pages/payment_page.dart';
import '../../features/property/presentation/cubit/property_cubit.dart';
import '../../features/property/presentation/pages/property_detail_page.dart';
import '../../features/search/presentation/bloc/search_bloc.dart';
import '../../features/search/presentation/pages/home_page.dart';
import '../../injection_container.dart';
import 'package:flutter_bloc/flutter_bloc.dart';


class _StreamChangeNotifier extends ChangeNotifier {
  late final StreamSubscription<dynamic> _sub;

  _StreamChangeNotifier(Stream<dynamic> stream) {
    _sub = stream.listen((_) => notifyListeners());
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

/// Dismisses the software keyboard on every route push, pop, replace, or remove.
/// This prevents the keyboard from persisting when navigating between screens.
class _KeyboardDismissObserver extends NavigatorObserver {
  void _dismiss() => FocusManager.instance.primaryFocus?.unfocus();

  @override
  void didPush(Route route, Route? previousRoute) => _dismiss();

  @override
  void didPop(Route route, Route? previousRoute) => _dismiss();

  @override
  void didReplace({Route? newRoute, Route? oldRoute}) => _dismiss();

  @override
  void didRemove(Route route, Route? previousRoute) => _dismiss();
}

GoRouter buildAppRouter() {
  final authBloc = sl<AuthBloc>();
  return GoRouter(
    initialLocation: '/splash',
    observers: [_KeyboardDismissObserver()],
    refreshListenable: _StreamChangeNotifier(authBloc.stream),
    redirect: (BuildContext context, GoRouterState state) {
      final isAuthenticated = sl<AuthBloc>().state is AuthAuthenticated;
      final protectedPaths = ['/home', '/checkout', '/booking', '/trips'];
      final isProtected =
          protectedPaths.any((p) => state.matchedLocation.startsWith(p));
      if (isProtected && !isAuthenticated) return '/login';
      return null;
    },
    routes: [
      GoRoute(
        name: 'splash',
        path: '/splash',
        builder: (_, __) => const SplashPage(),
      ),
      GoRoute(
        name: 'login',
        path: '/login',
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        name: 'register',
        path: '/register',
        builder: (_, __) => const RegisterPage(),
      ),
      GoRoute(
        name: 'verifyOtp',
        path: '/verify-otp',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return OtpPage(
            userId: args['userId'] as String? ?? '',
            devOtp: args['devOtp'] as String?,
            email: args['email'] as String?,
          );
        },
      ),
      GoRoute(
        name: 'home',
        path: '/home',
        builder: (_, __) => BlocProvider<SearchBloc>(
          create: (_) => sl<SearchBloc>(),
          child: const HomePage(),
        ),
      ),
      GoRoute(
        name: 'profile',
        path: '/profile',
        builder: (_, __) => const ProfilePage(),
      ),
      GoRoute(
        name: 'propertyDetail',
        path: '/property/:id',
        builder: (_, state) {
          final id = state.pathParameters['id']!;
          final args = state.extra as Map<String, dynamic>? ?? {};
          return BlocProvider<PropertyCubit>(
            create: (_) => sl<PropertyCubit>()..load(id),
            child: PropertyDetailPage(
              id: id,
              checkin: args['checkin'] as String?,
              checkout: args['checkout'] as String?,
              adults: args['adults'] as int? ?? 2,
            ),
          );
        },
      ),
      GoRoute(
        name: 'guestDetails',
        path: '/checkout/details',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          final cubit = sl<CheckoutCubit>();
          return GuestDetailsPage(
            cubit: cubit,
            roomTypeId: args['roomTypeId'] as String,
            ratePlanId: args['ratePlanId'] as String?,
            propertyId: args['propertyId'] as String,
            propertyName: args['propertyName'] as String,
            roomTypeName: args['roomTypeName'] as String,
            basePrice: (args['basePrice'] as num).toDouble(),
            checkin: args['checkin'] as String,
            checkout: args['checkout'] as String,
            adults: args['adults'] as int? ?? 1,
            children: args['children'] as int? ?? 0,
          );
        },
      ),
      GoRoute(
        name: 'payment',
        path: '/checkout/payment',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          final cubit = args['cubit'] as CheckoutCubit;
          return PaymentPage(
            cubit: cubit,
            holdId: args['holdId'] as String,
            ratePlanId: args['ratePlanId'] as String?,
            propertyName: args['propertyName'] as String,
            roomTypeName: args['roomTypeName'] as String,
            basePrice: (args['basePrice'] as num).toDouble(),
            checkin: args['checkin'] as String,
            checkout: args['checkout'] as String,
            adults: args['adults'] as int? ?? 1,
            children: args['children'] as int? ?? 0,
            guestDetails:
                args['guestDetails'] as Map<String, dynamic>,
          );
        },
      ),
      GoRoute(
        name: 'confirmation',
        path: '/booking/confirmation',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return ConfirmationPage(
            booking: args['booking'] as BookingEntity,
            propertyName: args['propertyName'] as String,
            roomTypeName: args['roomTypeName'] as String,
          );
        },
      ),
      GoRoute(
        name: 'trips',
        path: '/trips',
        builder: (_, __) => BlocProvider<TripsBloc>(
          create: (_) => sl<TripsBloc>(),
          child: const TripsPage(),
        ),
      ),
      GoRoute(
        name: 'tripDetail',
        path: '/trips/detail',
        builder: (_, state) {
          final args = state.extra as Map<String, dynamic>? ?? {};
          return TripDetailPage(
            booking: args['booking'] as BookingListItemEntity,
            tripsBloc: args['tripsBloc'] as TripsBloc,
          );
        },
      ),
    ],
  );
}
