import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/date_utils.dart' as du;
import '../../domain/entities/booking_list_item_entity.dart';
import '../bloc/trips_bloc.dart';

class TripDetailPage extends StatelessWidget {
  final BookingListItemEntity booking;
  final TripsBloc tripsBloc;

  const TripDetailPage({
    super.key,
    required this.booking,
    required this.tripsBloc,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider<TripsBloc>.value(
      value: tripsBloc,
      child: BlocConsumer<TripsBloc, TripsState>(
        listener: (context, state) {
          if (state is TripsLoaded) {
            if (state.cancelError != null) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.cancelError!),
                  backgroundColor: AppColors.danger,
                ),
              );
            } else if (state.cancellingId == null) {
              final updated =
                  state.all.where((b) => b.id == booking.id).firstOrNull;
              if (updated != null && updated.status == 'CANCELLED') {
                Navigator.of(context).pop();
              }
            }
          }
        },
        builder: (context, state) {
          final currentBooking = state is TripsLoaded
              ? state.all
                      .where((b) => b.id == booking.id)
                      .firstOrNull ??
                  booking
              : booking;
          final isCancelling = state is TripsLoaded &&
              state.cancellingId == booking.id;

          final nights = du.nightsBetween(
            DateTime.parse(currentBooking.checkin),
            DateTime.parse(currentBooking.checkout),
          );

          return Scaffold(
            appBar: AppBar(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              title: const Text(
                'Trip Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatusBanner(currentBooking),
                  const SizedBox(height: 16),
                  _buildPropertyCard(currentBooking),
                  const SizedBox(height: 16),
                  _buildDatesCard(currentBooking, nights),
                  const SizedBox(height: 16),
                  _buildConfirmationCard(context, currentBooking),
                  const SizedBox(height: 16),
                  _buildPriceCard(currentBooking, nights),
                  if (currentBooking.status == 'CONFIRMED') ...[
                    const SizedBox(height: 28),
                    _buildCancelButton(context, currentBooking, isCancelling),
                  ],
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusBanner(BookingListItemEntity b) {
    final isConfirmed = b.status == 'CONFIRMED';
    final isCancelled = b.status == 'CANCELLED';
    final color = isConfirmed
        ? AppColors.success
        : isCancelled
            ? AppColors.danger
            : AppColors.muted;
    final icon = isConfirmed
        ? Icons.check_circle_outline
        : isCancelled
            ? Icons.cancel_outlined
            : Icons.info_outline;
    final label = isConfirmed
        ? (b.isUpcoming ? 'Upcoming Stay' : 'Completed')
        : isCancelled
            ? 'Cancelled'
            : b.status;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Text(label,
              style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w600, color: color)),
          if (b.isCancelled && b.cancelledAt != null) ...[
            const Spacer(),
            Text(
              'on ${du.formatDate(b.cancelledAt!)}',
              style: const TextStyle(fontSize: 11, color: AppColors.muted),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPropertyCard(BookingListItemEntity b) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            b.propertyName,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.text,
            ),
          ),
          if (b.propertyCity != null) ...[
            const SizedBox(height: 3),
            Row(
              children: [
                const Icon(Icons.location_on_outlined,
                    size: 13, color: AppColors.muted),
                const SizedBox(width: 3),
                Text(b.propertyCity!,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.muted)),
              ],
            ),
          ],
          const SizedBox(height: 6),
          Text(
            b.roomTypeName,
            style: const TextStyle(
                fontSize: 13,
                color: AppColors.primary,
                fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 6),
          Text(
            'Guest: ${b.guestName}',
            style: const TextStyle(fontSize: 12, color: AppColors.muted),
          ),
        ],
      ),
    );
  }

  Widget _buildDatesCard(BookingListItemEntity b, int nights) {
    return _card(
      child: Row(
        children: [
          Expanded(
            child: _dateColumn('Check-in',
                du.formatDate(DateTime.parse(b.checkin))),
          ),
          Container(width: 1, height: 40, color: AppColors.border),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 16),
              child: _dateColumn('Check-out',
                  du.formatDate(DateTime.parse(b.checkout))),
            ),
          ),
          Container(width: 1, height: 40, color: AppColors.border),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 16),
              child: _dateColumn(
                'Duration',
                du.formatNights(nights),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dateColumn(String label, String value) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 11, color: AppColors.muted)),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text)),
        ],
      );

  Widget _buildConfirmationCard(
      BuildContext context, BookingListItemEntity b) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Confirmation Details',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text)),
          const SizedBox(height: 10),
          _detailRow('Confirmation #', b.confirmationNumber,
              copyable: true, context: context),
          const SizedBox(height: 8),
          _detailRow('Check-in PIN', b.pin,
              copyable: true, context: context, pinStyle: true),
          const SizedBox(height: 8),
          _detailRow(
              'Guests',
              '${b.adults} adult${b.adults != 1 ? 's' : ''}'
                  '${b.children > 0 ? ', ${b.children} children' : ''}'),
          const SizedBox(height: 8),
          _detailRow('Booked on', du.formatDate(b.createdAt)),
        ],
      ),
    );
  }

  Widget _detailRow(
    String label,
    String value, {
    bool copyable = false,
    bool pinStyle = false,
    BuildContext? context,
  }) {
    return Row(
      children: [
        SizedBox(
          width: 120,
          child: Text(label,
              style: const TextStyle(fontSize: 12, color: AppColors.muted)),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: pinStyle ? 16 : 13,
              fontWeight:
                  pinStyle ? FontWeight.w700 : FontWeight.w500,
              color: pinStyle ? AppColors.primary : AppColors.text,
              letterSpacing: pinStyle ? 3 : 0,
            ),
          ),
        ),
        if (copyable && context != null)
          GestureDetector(
            onTap: () {
              Clipboard.setData(ClipboardData(text: value));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Copied to clipboard')),
              );
            },
            child: const Icon(Icons.copy_outlined,
                size: 15, color: AppColors.muted),
          ),
      ],
    );
  }

  Widget _buildPriceCard(BookingListItemEntity b, int nights) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Price Summary',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text)),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                du.formatNights(nights),
                style: const TextStyle(fontSize: 13, color: AppColors.muted),
              ),
              Text(
                formatInr(b.totalPrice),
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text('Taxes & fees included',
              style: TextStyle(fontSize: 11, color: AppColors.muted)),
        ],
      ),
    );
  }

  Widget _buildCancelButton(
      BuildContext context, BookingListItemEntity b, bool isCancelling) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton(
        onPressed: isCancelling ? null : () => _confirmCancel(context, b),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.danger,
          side: const BorderSide(color: AppColors.danger),
          disabledForegroundColor: AppColors.muted,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w600),
        ),
        child: isCancelling
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(AppColors.danger),
                ),
              )
            : const Text('Cancel Booking'),
      ),
    );
  }

  Future<void> _confirmCancel(
      BuildContext context, BookingListItemEntity b) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel Booking?',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        content: Text(
          'Are you sure you want to cancel your stay at ${b.propertyName}? '
          'This action cannot be undone.',
          style: const TextStyle(fontSize: 14, color: AppColors.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep Booking'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      context.read<TripsBloc>().add(CancelBookingRequested(b.id));
    }
  }

  Widget _card({required Widget child}) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: child,
      );
}
