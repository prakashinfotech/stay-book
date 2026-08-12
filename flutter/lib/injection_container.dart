import 'package:get_it/get_it.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'core/network/dio_client.dart';
import 'core/theme/theme_cubit.dart';
import 'features/auth/data/datasources/auth_remote_datasource.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/domain/usecases/get_cached_user_usecase.dart';
import 'features/auth/domain/usecases/login_usecase.dart';
import 'features/auth/domain/usecases/logout_usecase.dart';
import 'features/auth/domain/usecases/register_usecase.dart';
import 'features/auth/domain/usecases/verify_otp_usecase.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/search/data/datasources/search_remote_datasource.dart';
import 'features/search/data/repositories/search_repository_impl.dart';
import 'features/search/domain/repositories/search_repository.dart';
import 'features/search/domain/usecases/get_destination_counts_usecase.dart';
import 'features/search/domain/usecases/get_featured_properties_usecase.dart';
import 'features/search/domain/usecases/get_suggestions_usecase.dart';
import 'features/search/domain/usecases/search_properties_usecase.dart';
import 'features/search/presentation/bloc/search_bloc.dart';
import 'features/property/data/datasources/property_remote_datasource.dart';
import 'features/property/data/repositories/property_repository_impl.dart';
import 'features/property/domain/repositories/property_repository.dart';
import 'features/property/domain/usecases/get_property_detail_usecase.dart';
import 'features/property/presentation/cubit/property_cubit.dart';
import 'features/checkout/data/datasources/booking_remote_datasource.dart';
import 'features/checkout/data/repositories/booking_repository_impl.dart';
import 'features/checkout/domain/repositories/checkout_repository.dart';
import 'features/checkout/domain/usecases/create_hold_usecase.dart';
import 'features/checkout/domain/usecases/create_booking_usecase.dart';
import 'features/checkout/domain/usecases/create_payment_order_usecase.dart';
import 'features/checkout/presentation/cubit/checkout_cubit.dart';
import 'features/trips/data/datasources/trips_remote_datasource.dart';
import 'features/trips/data/repositories/trips_repository_impl.dart';
import 'features/trips/domain/repositories/trips_repository.dart';
import 'features/trips/domain/usecases/get_my_bookings_usecase.dart';
import 'features/trips/domain/usecases/cancel_booking_usecase.dart';
import 'features/trips/presentation/bloc/trips_bloc.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // ── External ──────────────────────────────────────────────────────────────
  sl.registerLazySingleton<FlutterSecureStorage>(
    () => const FlutterSecureStorage(),
  );
  sl.registerLazySingleton<DioClient>(() => DioClient(sl()));

  // ── Theme ─────────────────────────────────────────────────────────────────
  sl.registerLazySingleton<ThemeCubit>(() => ThemeCubit(sl()));

  // ── Auth ──────────────────────────────────────────────────────────────────
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(sl<DioClient>().dio),
  );
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(sl(), sl()),
  );
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => RegisterUseCase(sl()));
  sl.registerLazySingleton(() => VerifyOtpUseCase(sl()));
  sl.registerLazySingleton(() => LogoutUseCase(sl()));
  sl.registerLazySingleton(() => GetCachedUserUseCase(sl()));
  sl.registerLazySingleton<AuthBloc>(
    () => AuthBloc(
      getCachedUser: sl(),
      login: sl(),
      register: sl(),
      verifyOtp: sl(),
      logout: sl(),
    ),
  );

  // ── Search ────────────────────────────────────────────────────────────────
  sl.registerLazySingleton<SearchRemoteDataSource>(
    () => SearchRemoteDataSourceImpl(sl<DioClient>().dio),
  );
  sl.registerLazySingleton<SearchRepository>(
    () => SearchRepositoryImpl(sl()),
  );
  sl.registerLazySingleton(() => SearchPropertiesUseCase(sl()));
  sl.registerLazySingleton(() => GetSuggestionsUseCase(sl()));
  sl.registerLazySingleton(() => GetDestinationCountsUseCase(sl()));
  sl.registerLazySingleton(() => GetFeaturedPropertiesUseCase(sl()));
  sl.registerFactory<SearchBloc>(
    () => SearchBloc(
      getDestinations: sl(),
      searchProperties: sl(),
      getFeatured: sl(),
    ),
  );

  // ── Property ──────────────────────────────────────────────────────────────
  sl.registerLazySingleton<PropertyRemoteDataSource>(
    () => PropertyRemoteDataSourceImpl(sl<DioClient>().dio),
  );
  sl.registerLazySingleton<PropertyRepository>(
    () => PropertyRepositoryImpl(sl()),
  );
  sl.registerLazySingleton(() => GetPropertyDetailUseCase(sl()));
  sl.registerFactory<PropertyCubit>(() => PropertyCubit(sl()));

  // ── Checkout ──────────────────────────────────────────────────────────────
  sl.registerLazySingleton<BookingRemoteDataSource>(
    () => BookingRemoteDataSourceImpl(sl<DioClient>().dio),
  );
  sl.registerLazySingleton<CheckoutRepository>(
    () => BookingRepositoryImpl(sl()),
  );
  sl.registerLazySingleton(() => CreateHoldUseCase(sl()));
  sl.registerLazySingleton(() => CreateBookingUseCase(sl()));
  sl.registerLazySingleton(() => CreatePaymentOrderUseCase(sl()));
  sl.registerFactory<CheckoutCubit>(() => CheckoutCubit(sl(), sl(), sl()));

  // ── Trips ─────────────────────────────────────────────────────────────────
  sl.registerLazySingleton<TripsRemoteDataSource>(
    () => TripsRemoteDataSourceImpl(sl<DioClient>().dio),
  );
  sl.registerLazySingleton<TripsRepository>(
    () => TripsRepositoryImpl(sl()),
  );
  sl.registerLazySingleton(() => GetMyBookingsUseCase(sl()));
  sl.registerLazySingleton(() => CancelBookingUseCase(sl()));
  sl.registerFactory<TripsBloc>(() => TripsBloc(sl(), sl()));
}
