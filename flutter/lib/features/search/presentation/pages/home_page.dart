import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../../../features/auth/presentation/bloc/auth_state.dart';
import '../../domain/entities/search_params.dart';
import '../bloc/search_bloc.dart';
import '../bloc/search_event.dart';
import '../bloc/search_state.dart';
import '../widgets/explore_city_card.dart';
import '../widgets/featured_property_card.dart';
import '../widgets/property_list_card.dart';
import '../widgets/search_bar_widget.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    context.read<SearchBloc>().add(const SearchInitialised());
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SearchBloc, SearchState>(
      builder: (context, state) {
        final isResults = state is SearchResultsLoaded;
        return PopScope(
          canPop: !isResults,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop && isResults) {
              context.read<SearchBloc>().add(const SearchReset());
            }
          },
          child: Scaffold(
            body: RefreshIndicator(
              color: Theme.of(context).colorScheme.primary,
              // displace the spinner so it shows just below the search card,
              // not at the very top above the app bar
              displacement: 16,
              edgeOffset: 0,
              onRefresh: () async {
                context.read<SearchBloc>().add(const SearchInitialised());
                await Future.delayed(const Duration(milliseconds: 800));
              },
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  _buildAppBar(context, isResults, state),
                  SliverToBoxAdapter(child: _buildSearchBar(state)),
                  if (state is SearchLoading)
                    const SliverFillRemaining(
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (state is SearchError)
                    SliverFillRemaining(child: _buildError(state.message))
                  else if (state is SearchHomeLoaded)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: _buildExploreSection(state),
                    )
                  else if (state is SearchResultsLoaded)
                    SliverToBoxAdapter(child: _buildResults(state)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAppBar(
      BuildContext context, bool isResults, SearchState state) {
    final theme = Theme.of(context);
    return SliverAppBar(
      expandedHeight: 130,
      floating: true,
      snap: true,
      pinned: false,
      backgroundColor: theme.colorScheme.primary,
      leading: isResults
          ? IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () =>
                  context.read<SearchBloc>().add(const SearchReset()),
            )
          : null,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: AppGradients.primaryButton(theme.brightness),
          ),
          padding: const EdgeInsets.fromLTRB(20, 60, 20, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              BlocBuilder<AuthBloc, AuthState>(
                builder: (context, authState) {
                  final name = authState is AuthAuthenticated
                      ? authState.user.firstName ?? 'there'
                      : '';
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        isResults
                            ? 'Search results'
                            : 'Hello${name.isNotEmpty ? ', $name' : ''}! 👋',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        isResults
                            ? '${(state as SearchResultsLoaded).total} properties found'
                            : 'Find your perfect stay in India',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  );
                },
              ),
              GestureDetector(
                onTap: () => context.pushNamed('profile'),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(Icons.person_outline,
                      color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar(SearchState state) {
    final initialDest = state is SearchResultsLoaded
        ? state.params.destination
        : null;
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: SearchBarWidget(
        // Key forces widget to fully rebuild (fresh initState) when
        // returning from results → home, clearing the destination text.
        key: ValueKey(initialDest ?? '__home_fresh__'),
        initialDestination: initialDest,
      ),
    );
  }

  Widget _buildExploreSection(SearchHomeLoaded state) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 0, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(right: 16, bottom: 14),
            child: Text(
              'Explore India',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.text,
              ),
            ),
          ),
          if (state.destinations.isEmpty)
            const Padding(
              padding: EdgeInsets.only(right: 16, top: 8),
              child: Text(
                'No destinations available yet.',
                style: TextStyle(color: AppColors.muted),
              ),
            )
          else
            SizedBox(
              height: 108,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: state.destinations.length,
                itemBuilder: (context, i) => ExploreCityCard(
                  destination: state.destinations[i],
                  onTap: () {
                    context.read<SearchBloc>().add(
                          SearchSubmitted(
                            SearchParams(
                              destination: state.destinations[i].city,
                              checkin: _todayStr(),
                              checkout: _tomorrowStr(),
                            ),
                          ),
                        );
                  },
                ),
              ),
            ),
          if (state.featured.isNotEmpty) ...[
            const Padding(
              padding: EdgeInsets.only(right: 16, top: 24, bottom: 14),
              child: Text(
                'Featured Properties',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
            ),
            SizedBox(
              height: 210,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: state.featured.length,
                itemBuilder: (context, i) => FeaturedPropertyCard(
                  property: state.featured[i],
                  onTap: () => context.pushNamed(
                    'propertyDetail',
                    pathParameters: {'id': state.featured[i].id},
                    extra: {
                      'checkin': _todayStr(),
                      'checkout': _tomorrowStr(),
                      'adults': 2,
                    },
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildResults(SearchResultsLoaded state) {
    if (state.results.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 40),
        child: Center(
          child: Column(
            children: [
              const Icon(Icons.search_off, size: 64, color: AppColors.border),
              const SizedBox(height: 16),
              Text(
                'No properties found in "${state.params.destination}"',
                style: const TextStyle(
                  fontSize: 15,
                  color: AppColors.muted,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: state.results
            .map(
              (p) => PropertyListCard(
                property: p,
                onTap: () => context.pushNamed(
                  'propertyDetail',
                  pathParameters: {'id': p.id},
                  extra: {
                    'checkin': state.params.checkin,
                    'checkout': state.params.checkout,
                    'adults': state.params.adults,
                  },
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildError(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56, color: AppColors.danger),
            const SizedBox(height: 12),
            Text(message,
                style: const TextStyle(color: AppColors.muted),
                textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () =>
                  context.read<SearchBloc>().add(const SearchInitialised()),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  String _todayStr() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  String _tomorrowStr() {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return '${tomorrow.year}-${tomorrow.month.toString().padLeft(2, '0')}-${tomorrow.day.toString().padLeft(2, '0')}';
  }
}
