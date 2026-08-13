import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/date_utils.dart' as du;
import '../../domain/entities/booking_list_item_entity.dart';
import '../bloc/trips_bloc.dart';

class TripsPage extends StatefulWidget {
  const TripsPage({super.key});

  @override
  State<TripsPage> createState() => _TripsPageState();
}

class _TripsPageState extends State<TripsPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<TripsBloc>().add(const TripsInitialised());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<TripsBloc, TripsState>(
      listener: (context, state) {
        if (state is TripsLoaded && state.cancelError != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.cancelError!),
              backgroundColor: AppColors.danger,
            ),
          );
        }
      },
      builder: (context, state) {
        final scheme = Theme.of(context).colorScheme;
        return Scaffold(
          appBar: AppBar(
            backgroundColor: scheme.primary,
            foregroundColor: Colors.white,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.goNamed('home');
                }
              },
            ),
            title: const Text(
              'My Trips',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: scheme.secondary,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white60,
              labelStyle: const TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w600),
              tabs: _buildTabs(state),
            ),
          ),
          body: switch (state) {
            TripsLoading() || TripsInitial() => const Center(
                child: CircularProgressIndicator(),
              ),
            TripsError(:final message) => _buildError(message),
            TripsLoaded() => _buildTabContent(state),
            _ => const SizedBox.shrink(),
          },
        );
      },
    );
  }

  /// Builds tab labels — shows count badge when data is loaded.
  List<Widget> _buildTabs(TripsState state) {
    if (state is! TripsLoaded) {
      return const [
        Tab(text: 'Past'),
        Tab(text: 'Cancelled'),
      ];
    }
    final pastCount = [
      ...state.upcoming,
      ...state.past,
    ].where((b) => b.status == 'CONFIRMED').length;
    final cancelCount = state.cancelled.length;
    return [
      _tabLabel('Past', pastCount),
      _tabLabel('Cancelled', cancelCount),
    ];
  }

  Widget _tabLabel(String label, int count) {
    return Tab(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          if (count > 0) ...
            [
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
        ],
      ),
    );
  }

  Widget _buildTabContent(TripsLoaded state) {
    // Only CONFIRMED bookings in Past tab (excludes cancelled, pending etc.)
    final confirmedBookings = [
      ...state.upcoming,
      ...state.past,
    ].where((b) => b.status == 'CONFIRMED').toList();

    return TabBarView(
      controller: _tabController,
      children: [
        _buildList(confirmedBookings, state, emptyMsg: 'No past bookings'),
        _buildList(state.cancelled, state, emptyMsg: 'No cancelled bookings'),
      ],
    );
  }

  Widget _buildList(
    List<BookingListItemEntity> items,
    TripsLoaded state, {
    required String emptyMsg,
  }) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.luggage_outlined,
                size: 64, color: AppColors.border),
            const SizedBox(height: 12),
            Text(emptyMsg,
                style: const TextStyle(color: AppColors.muted, fontSize: 15)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async =>
          context.read<TripsBloc>().add(const TripsInitialised()),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (_, i) => _BookingCard(
          booking: items[i],
          isCancelling: state.cancellingId == items[i].id,
          onTap: () => context.pushNamed(
            'tripDetail',
            extra: {
              'booking': items[i],
              'tripsBloc': context.read<TripsBloc>(),
            },
          ),
        ),
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
                  context.read<TripsBloc>().add(const TripsInitialised()),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final BookingListItemEntity booking;
  final bool isCancelling;
  final VoidCallback onTap;

  const _BookingCard({
    required this.booking,
    required this.isCancelling,
    required this.onTap,
  });

  Color get _statusColor {
    switch (booking.status) {
      case 'CONFIRMED':
        return AppColors.success;
      case 'CANCELLED':
        return AppColors.danger;
      default:
        return AppColors.muted;
    }
  }

  String get _statusLabel {
    switch (booking.status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return booking.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final nights = du.nightsBetween(
      DateTime.parse(booking.checkin),
      DateTime.parse(booking.checkout),
    );
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: _statusColor.withValues(alpha: 0.08),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _statusColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _statusLabel,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _statusColor,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    booking.confirmationNumber,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.muted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    booking.propertyName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      if (booking.propertyCity != null) ...[
                        const Icon(Icons.location_on_outlined,
                            size: 12, color: AppColors.muted),
                        const SizedBox(width: 2),
                        Text(
                          '${booking.propertyCity}  ·  ',
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.muted),
                        ),
                      ],
                      Text(
                        booking.roomTypeName,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.muted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _infoChip(Icons.calendar_today_outlined,
                          du.formatDate(DateTime.parse(booking.checkin))),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward,
                          size: 12, color: AppColors.muted),
                      const SizedBox(width: 6),
                      _infoChip(Icons.calendar_today_outlined,
                          du.formatDate(DateTime.parse(booking.checkout))),
                      const Spacer(),
                      Text(
                        '${du.formatNights(nights)} · ${formatInr(booking.totalPrice)}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                    ],
                  ),
                  if (isCancelling) ...[
                    const SizedBox(height: 10),
                    const LinearProgressIndicator(
                      backgroundColor: AppColors.border,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppColors.danger),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String text) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: AppColors.muted),
          const SizedBox(width: 3),
          Text(text,
              style: const TextStyle(fontSize: 11, color: AppColors.muted)),
        ],
      );
}
