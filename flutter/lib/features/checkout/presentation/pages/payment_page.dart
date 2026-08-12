import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/date_utils.dart' as du;
import '../cubit/checkout_cubit.dart';

class PaymentPage extends StatefulWidget {
  final CheckoutCubit cubit;
  final String holdId;
  final String? ratePlanId;
  final String propertyName;
  final String roomTypeName;
  final double basePrice;
  final String checkin;
  final String checkout;
  final int adults;
  final int children;
  final Map<String, dynamic> guestDetails;

  const PaymentPage({
    super.key,
    required this.cubit,
    required this.holdId,
    required this.ratePlanId,
    required this.propertyName,
    required this.roomTypeName,
    required this.basePrice,
    required this.checkin,
    required this.checkout,
    required this.adults,
    required this.children,
    required this.guestDetails,
  });

  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  late final Razorpay _razorpay;
  String? _pendingOrderId; // fallback for nullable PaymentSuccessResponse.orderId

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  int get _nights => du.nightsBetween(
        DateTime.parse(widget.checkin),
        DateTime.parse(widget.checkout),
      );

  double get _totalPrice => widget.basePrice * _nights;

  void _onPay() {
    FocusScope.of(context).unfocus();
    widget.cubit.createPaymentOrder(
      totalPriceInRupees: _totalPrice,
      holdId: widget.holdId,
    );
  }

  void _openRazorpay(PaymentOrderReady state) {
    _pendingOrderId = state.orderId;
    _razorpay.open(<String, Object>{
      'key': state.keyId,
      'amount': state.amount, // paise from server — DO NOT multiply again
      'currency': state.currency,
      'order_id': state.orderId,
      'name': widget.propertyName,
      'description': widget.roomTypeName,
      'prefill': {
        'name':
            '${widget.guestDetails['firstName'] ?? ''} ${widget.guestDetails['lastName'] ?? ''}'
                .trim(),
        'email': widget.guestDetails['email'] as String? ?? '',
        'contact': widget.guestDetails['phone'] as String? ?? '',
      },
      'theme': {'color': '#003580'},
    });
  }

  void _onPaymentSuccess(PaymentSuccessResponse response) {
    widget.cubit.submitBooking(
      holdId: widget.holdId,
      ratePlanId: widget.ratePlanId,
      adults: widget.adults,
      children: widget.children,
      guestDetails: widget.guestDetails,
      payment: {
        'razorpayOrderId': response.orderId ?? _pendingOrderId ?? '',
        'razorpayPaymentId': response.paymentId ?? '',
        'razorpaySignature': response.signature ?? '',
      },
    );
  }

  void _onPaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(response.message ?? 'Payment failed. Please try again.'),
        backgroundColor: AppColors.danger,
      ),
    );
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    // Razorpay handles external wallet flow natively — no action needed here.
  }

  /// Dev-only: bypass Razorpay checkout when emulator has no internet.
  /// Requires DEV_BYPASS_PAYMENT=true in server/.env
  void _onDevBypass() {
    widget.cubit.submitBooking(
      holdId: widget.holdId,
      ratePlanId: widget.ratePlanId,
      adults: widget.adults,
      children: widget.children,
      guestDetails: widget.guestDetails,
      payment: {
        'razorpayOrderId': 'dev_order_bypass',
        'razorpayPaymentId': 'dev_pay_bypass',
        'razorpaySignature': 'dev_sig_bypass',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider<CheckoutCubit>.value(
      value: widget.cubit,
      child: BlocConsumer<CheckoutCubit, CheckoutState>(
        listener: (context, state) {
          if (state is PaymentOrderReady) {
            _openRazorpay(state);
          } else if (state is BookingSuccess) {
            context.pushNamed('confirmation', extra: {
              'booking': state.booking,
              'propertyName': widget.propertyName,
              'roomTypeName': widget.roomTypeName,
            });
          } else if (state is CheckoutError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.danger,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading =
              state is PaymentOrderLoading || state is BookingLoading;
          return Scaffold(
            appBar: AppBar(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              title: const Text(
                'Payment',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
            body: GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              behavior: HitTestBehavior.opaque,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildPriceSummary(),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.lock_outline,
                              size: 18, color: AppColors.muted),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Tap Pay to open the secure Razorpay checkout. '
                              'Pay via card, UPI, netbanking, or wallet.',
                              style: TextStyle(
                                  fontSize: 13, color: AppColors.muted),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : _onPay,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: AppColors.border,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        child: isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white),
                                ),
                              )
                            : Text('Pay ${formatInr(_totalPrice)}'),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        Icon(Icons.lock_outline,
                            size: 13, color: AppColors.muted),
                        SizedBox(width: 4),
                        Text(
                          'Secured by Razorpay',
                          style:
                              TextStyle(fontSize: 11, color: AppColors.muted),
                        ),
                      ],
                    ),
                    if (kDebugMode) ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      TextButton.icon(
                        onPressed: isLoading ? null : _onDevBypass,
                        icon: const Icon(Icons.developer_mode, size: 14),
                        label: const Text(
                          'Dev: Skip Razorpay (emulator bypass)',
                          style: TextStyle(fontSize: 12),
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.muted,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Price summary ──────────────────────────────────────────────────────────
  Widget _buildPriceSummary() {
    final nights = _nights;
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.propertyName,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text)),
          const SizedBox(height: 2),
          Text(widget.roomTypeName,
              style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          const Divider(height: 20, color: AppColors.border),
          _priceRow(
              '${formatInr(widget.basePrice)} × ${du.formatNights(nights)}',
              formatInr(_totalPrice)),
          const SizedBox(height: 6),
          _priceRow('Taxes & fees', 'Included'),
          const Divider(height: 16, color: AppColors.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text)),
              Text(formatInr(_totalPrice),
                  style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _priceRow(String label, String value) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text)),
        ],
      );
}
