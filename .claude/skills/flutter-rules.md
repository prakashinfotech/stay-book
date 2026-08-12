# FLUTTER DEVELOPMENT RULES

You are an expert in Flutter, Dart, Clean Architecture, BLoC pattern, and mobile development for booking and ecommerce systems.

---

## Key Principles

- Use strict Dart null-safety — no `!` force-unwrap without a guard, no implicit `dynamic`.
- Use `async`/`await` for all asynchronous operations — never raw Futures or callbacks.
- Follow SOLID principles: one BLoC per screen, one repository per feature domain.
- All state management via BLoC/Cubit — **never use `setState` in production pages**.
- Widgets are pure view: they dispatch events and render state, no business logic.
- Domain layer is pure Dart — zero Flutter, Dio, or storage imports.

---

## Clean Architecture Layers

```
Presentation → Domain ← Data
```

| Layer | Responsibility | Dependencies |
|-------|---------------|--------------|
| **Domain** | Entities, abstract Repositories, Use Cases | Pure Dart only |
| **Data** | Models (fromJson/toJson), DataSources, RepositoryImpl | Dio, SecureStorage |
| **Presentation** | BLoC/Cubit, Pages, Widgets | flutter_bloc, Domain |

Rules:
- Domain never imports from Data or Presentation
- Data implements Domain repository contracts
- Presentation depends only on Domain use cases and entities

---

## Project Structure (feature-first)

```
lib/
├── main.dart                      # DI init + runApp
├── app.dart                       # MaterialApp.router + theme
├── injection_container.dart       # all get_it registrations
├── core/
│   ├── constants/app_constants.dart
│   ├── errors/failures.dart       # ServerFailure, NetworkFailure, CacheFailure
│   ├── errors/exceptions.dart     # ServerException, NetworkException
│   ├── network/
│   │   ├── dio_client.dart
│   │   └── auth_interceptor.dart
│   ├── theme/
│   │   ├── app_theme.dart
│   │   └── app_text_styles.dart
│   ├── utils/
│   │   ├── date_utils.dart
│   │   └── currency_utils.dart
│   └── router/app_router.dart
└── features/
    └── <feature>/
        ├── data/
        │   ├── models/            # JSON models (json_serializable + freezed)
        │   ├── datasources/       # remote (Dio) and local (secure storage)
        │   └── repositories/      # RepositoryImpl
        ├── domain/
        │   ├── entities/          # pure Dart data classes
        │   ├── repositories/      # abstract interfaces
        │   └── usecases/          # single-method classes: call()
        └── presentation/
            ├── bloc/              # XxxBloc, XxxEvent, XxxState
            ├── pages/             # full-screen widgets
            └── widgets/           # reusable sub-widgets
```

---

## Naming Conventions

- **Files**: `snake_case.dart`
- **Classes**: `PascalCase`
- **Variables / functions**: `camelCase`
- **Constants**: `kCamelCase` (e.g. `kBaseUrl`)
- **Enums**: `PascalCase` values
- **BLoC files**: `feature_bloc.dart`, `feature_event.dart`, `feature_state.dart`
- **Model files**: `feature_model.dart` (data layer), `feature_entity.dart` (domain layer)

---

## BLoC Pattern

```dart
// event
abstract class AuthEvent extends Equatable {
  const AuthEvent();
}
class LoginRequested extends AuthEvent {
  final String email;
  final String password;
  const LoginRequested(this.email, this.password);
  @override List<Object> get props => [email, password];
}

// state
abstract class AuthState extends Equatable {
  const AuthState();
}
class AuthLoading extends AuthState {
  @override List<Object> get props => [];
}
class AuthAuthenticated extends AuthState {
  final UserEntity user;
  const AuthAuthenticated(this.user);
  @override List<Object> get props => [user];
}
class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
  @override List<Object> get props => [message];
}

// bloc
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase _login;
  AuthBloc(this._login) : super(const AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
  }
  Future<void> _onLoginRequested(LoginRequested event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());
    final result = await _login(LoginParams(email: event.email, password: event.password));
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (user)    => emit(AuthAuthenticated(user)),
    );
  }
}
```

### Rules
- Every `Event` and `State` extends `Equatable`
- One `Bloc` per screen/feature — no god blocs
- Use `Cubit` when there are no complex event-to-state transformations
- Never access BLoC state directly in `build()` — use `BlocBuilder` / `BlocListener`
- Wrap async side-effects (navigation, snackbars) in `BlocListener`, not `BlocBuilder`

---

## Dependency Injection (get_it)

```dart
// injection_container.dart
final sl = GetIt.instance;

Future<void> init() async {
  // External
  sl.registerLazySingleton(() => DioClient(sl()));
  sl.registerLazySingleton(() => const FlutterSecureStorage());

  // Auth feature
  sl.registerFactory(() => AuthBloc(sl()));
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(sl()));
  sl.registerLazySingleton<AuthRemoteDataSource>(() => AuthRemoteDataSourceImpl(sl()));
}
```

### Rules
- Blocs → `registerFactory` (new instance per screen)
- Use Cases, Repositories, DataSources → `registerLazySingleton`
- External deps (Dio, SecureStorage) → `registerLazySingleton`
- Call `sl.init()` before `runApp()` in `main.dart`

---

## Network Layer (Dio)

```dart
// auth_interceptor.dart
class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  final Dio _dio;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // attempt token refresh
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken != null) {
        try {
          final res = await _dio.post('/auth/refresh', data: {'refreshToken': refreshToken});
          final newToken = res.data['data']['accessToken'] as String;
          await _storage.write(key: 'access_token', value: newToken);
          // retry original request
          err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
          final retried = await _dio.fetch(err.requestOptions);
          return handler.resolve(retried);
        } catch (_) {
          await _storage.deleteAll();
        }
      }
    }
    handler.next(err);
  }
}
```

### Rules
- Use `DioException` (not `DioError`) — Dio 5.x
- Wrap all Dio calls in try-catch; throw typed `ServerException` with message from response body
- Response envelope: `{ statusCode, data, message }` — always read `response.data['data']`
- Base URL from `kBaseUrl` constant — `10.0.2.2:3001` for Android emulator, `localhost:3001` for iOS

---

## Error Handling

```dart
// failures.dart
abstract class Failure extends Equatable {
  final String message;
  const Failure(this.message);
  @override List<Object> get props => [message];
}
class ServerFailure extends Failure {
  const ServerFailure(super.message);
}
class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'No internet connection']);
}

// repository implementation pattern
@override
Future<Either<Failure, UserEntity>> login(String email, String password) async {
  try {
    final model = await _remoteDs.login(email, password);
    return Right(model.toEntity());
  } on ServerException catch (e) {
    return Left(ServerFailure(e.message));
  } on SocketException {
    return Left(const NetworkFailure());
  }
}
```

### Rules
- Every repository method returns `Future<Either<Failure, T>>`
- Every use case `call()` returns `Future<Either<Failure, T>>`
- Fold the Either in the BLoC — never in widgets
- Use `dartz` package for `Either`

---

## Navigation (go_router)

```dart
// app_router.dart
final appRouter = GoRouter(
  initialLocation: '/splash',
  redirect: (context, state) {
    final authenticated = sl<AuthBloc>().state is AuthAuthenticated;
    final protectedPaths = ['/home', '/checkout', '/trips'];
    final isProtected = protectedPaths.any((p) => state.matchedLocation.startsWith(p));
    if (isProtected && !authenticated) return '/login';
    return null;
  },
  routes: [
    GoRoute(name: 'splash',        path: '/splash',      builder: (_, __) => const SplashPage()),
    GoRoute(name: 'login',         path: '/login',       builder: (_, __) => const LoginPage()),
    GoRoute(name: 'register',      path: '/register',    builder: (_, __) => const RegisterPage()),
    GoRoute(name: 'verifyOtp',     path: '/verify-otp',  builder: (_, s)  => OtpPage(userId: s.extra as String)),
    GoRoute(name: 'home',          path: '/home',        builder: (_, __) => const HomePage()),
    GoRoute(name: 'propertyDetail',path: '/property/:id',builder: (_, s)  => PropertyDetailPage(id: s.pathParameters['id']!)),
    // ... checkout and trips routes
  ],
);
```

### Rules
- Always use **named routes**: `context.goNamed('home')`
- Pass objects via `extra`, not query params, for complex data
- Auth guard in `redirect` — never in page `initState`
- Use `ShellRoute` for bottom-nav tabs (home + trips)

---

## Models & Entities

```dart
// data layer — with json_serializable
@JsonSerializable()
class SearchResultModel {
  final String id;
  final String name;
  final String city;
  @JsonKey(name: 'min_price') final String? minPrice;
  @JsonKey(name: 'cover_image') final String? coverImage;
  @JsonKey(name: 'star_rating') final double? starRating;

  const SearchResultModel({required this.id, ...});
  factory SearchResultModel.fromJson(Map<String, dynamic> json) => _$SearchResultModelFromJson(json);
  Map<String, dynamic> toJson() => _$SearchResultModelToJson(this);

  SearchResultEntity toEntity() => SearchResultEntity(id: id, name: name, ...);
}

// domain layer — pure Dart
class SearchResultEntity extends Equatable {
  final String id;
  final String name;
  final String city;
  const SearchResultEntity({required this.id, required this.name, required this.city});
  @override List<Object?> get props => [id, name, city];
}
```

### Rules
- Models live in `data/models/` — handle JSON, extend nothing
- Entities live in `domain/entities/` — extend `Equatable`, no JSON methods
- Use `@JsonKey(name: 'snake_case_key')` for all non-matching fields
- Run `flutter pub run build_runner build --delete-conflicting-outputs` after changes

---

## Forms & Validation

```dart
final _formKey = GlobalKey<FormState>();

TextFormField(
  validator: (v) {
    if (v == null || v.isEmpty) return 'Required';
    if (!v.contains('@')) return 'Invalid email';
    return null;
  },
)

// submit
if (_formKey.currentState!.validate()) {
  _formKey.currentState!.save();
  context.read<AuthBloc>().add(LoginRequested(email, password));
}
```

### Rules
- Use `Form` + `GlobalKey<FormState>` for all multi-field forms
- Validate on submit, not on every keystroke
- Dispatch BLoC event on valid submit — never call API from widget directly
- Show loading state by listening to BLoC: disable button while `AuthLoading`

---

## Testing

```dart
// BLoC test
blocTest<AuthBloc, AuthState>(
  'emits [AuthLoading, AuthAuthenticated] when login succeeds',
  build: () {
    when(() => mockLoginUseCase(any())).thenAnswer((_) async => Right(tUser));
    return AuthBloc(mockLoginUseCase);
  },
  act: (bloc) => bloc.add(const LoginRequested('a@b.com', 'pass')),
  expect: () => [const AuthLoading(), AuthAuthenticated(tUser)],
);
```

### Rules
- Test every BLoC with `bloc_test` and `mocktail`
- Test every use case with mock repositories
- No widget tests for initial MVP — focus on BLoC unit tests
- Name test files `*_test.dart` in `test/features/<feature>/`

---

## Key Commands

```bash
# Development
flutter run                          # run on connected device/emulator
flutter run --flavor development     # with flavor
flutter hot-reload                   # r (in terminal), saves state

# Code generation
flutter pub run build_runner build --delete-conflicting-outputs
flutter pub run build_runner watch   # watch mode

# Analysis & Testing
flutter analyze                      # static analysis (must pass with 0 errors)
flutter test                         # unit tests
flutter test --coverage              # with coverage

# Build
flutter build apk --release          # Android APK
flutter build ios --release          # iOS (macOS only)

# Dependencies
flutter pub get                      # install packages
flutter pub upgrade                  # upgrade to latest allowed versions
flutter pub outdated                 # check for newer versions
```

---

## Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  # State management
  flutter_bloc: ^8.1.6
  equatable: ^2.0.5
  # Navigation
  go_router: ^14.0.0
  # Network
  dio: ^5.4.3
  # Storage
  flutter_secure_storage: ^9.2.2
  # DI
  get_it: ^8.0.0
  # Error handling
  dartz: ^0.10.1
  # Immutable models
  freezed_annotation: ^2.4.4
  json_annotation: ^4.9.0
  # Images
  cached_network_image: ^3.3.1
  # Utilities
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  # Code generation
  freezed: ^2.5.2
  json_serializable: ^6.8.0
  build_runner: ^2.4.9
  # Testing
  bloc_test: ^9.1.7
  mocktail: ^1.0.4
```

---

## Critical Rules

- Never run `git push`, `rm -rf`, or destructive operations without explicit user approval.
- Always ask before any `git commit`, `git add`, `git reset`, or `git merge`.
- Run `flutter analyze` before declaring any screen complete.
- Run `build_runner` after every model/entity change.
- Never hardcode the API base URL in a feature file — always use `kBaseUrl` from `app_constants.dart`.
- `flutter_secure_storage` for all tokens — never `SharedPreferences` for sensitive data.
- All API error messages come from `response.data['error']['message']` or `response.data['message']`.
