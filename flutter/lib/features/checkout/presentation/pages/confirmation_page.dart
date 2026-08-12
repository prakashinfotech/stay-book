import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/date_utils.dart' as du;
import '../../domain/entities/booking_entity.dart';

// ── Confetti particle ─────────────────────────────────────────────────────────
class _Particle {
  double x, y, vx, vy, size, angle, spin, opacity;
  final Color color;
  _Particle({
    required this.x,
    required this.y,
    required this.vx,
    required this.vy,
    required this.size,
    required this.angle,
    required this.spin,
    required this.opacity,
    required this.color,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_Particle> particles;
  _ConfettiPainter(this.particles);

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      final paint = Paint()
        ..color = p.color.withValues(alpha: p.opacity)
        ..style = PaintingStyle.fill;
      canvas.save();
      canvas.translate(p.x * size.width, p.y * size.height);
      canvas.rotate(p.angle);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.5),
          const Radius.circular(2),
        ),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter old) => true;
}

// ── Animated checkmark painter ────────────────────────────────────────────────
class _CheckmarkPainter extends CustomPainter {
  final double progress;
  final Color color;
  _CheckmarkPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final path = Path();
    // checkmark: short leg (0→0.4) then long leg (0.4→1.0)
    final p1 = Offset(size.width * 0.2, size.height * 0.52);
    final p2 = Offset(size.width * 0.42, size.height * 0.72);
    final p3 = Offset(size.width * 0.78, size.height * 0.30);

    path.moveTo(p1.dx, p1.dy);
    path.lineTo(p2.dx, p2.dy);
    path.lineTo(p3.dx, p3.dy);

    final metric = path.computeMetrics().first;
    final drawn = metric.extractPath(0, metric.length * progress.clamp(0, 1));
    canvas.drawPath(drawn, paint);
  }

  @override
  bool shouldRepaint(_CheckmarkPainter old) => old.progress != progress;
}

// ── Main Confirmation Page ────────────────────────────────────────────────────
class ConfirmationPage extends StatefulWidget {
  final BookingEntity booking;
  final String propertyName;
  final String roomTypeName;

  const ConfirmationPage({
    super.key,
    required this.booking,
    required this.propertyName,
    required this.roomTypeName,
  });

  @override
  State<ConfirmationPage> createState() => _ConfirmationPageState();
}

class _ConfirmationPageState extends State<ConfirmationPage>
    with TickerProviderStateMixin {
  late final AnimationController _circleCtrl;
  late final AnimationController _checkCtrl;
  late final AnimationController _confettiCtrl;
  late final AnimationController _slideCtrl;
  late final AnimationController _pulseCtrl;

  late final Animation<double> _circleScale;
  late final Animation<double> _circleOpacity;
  late final Animation<double> _checkProgress;
  late final Animation<double> _slideY;
  late final Animation<double> _fadeIn;
  late final Animation<double> _pulse;

  final List<_Particle> _particles = [];
  final math.Random _rng = math.Random();

  static const _confettiColors = [
    Color(0xFFFFCC00),
    Color(0xFF003580),
    Color(0xFF00875A),
    Color(0xFFE53935),
    Color(0xFF8E24AA),
    Color(0xFF00ACC1),
    Color(0xFFFF7043),
  ];

  @override
  void initState() {
    super.initState();

    // Circle burst
    _circleCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _circleScale = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _circleCtrl, curve: Curves.elasticOut));
    _circleOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
            parent: _circleCtrl,
            curve: const Interval(0.0, 0.5, curve: Curves.easeIn)));

    // Checkmark draw
    _checkCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _checkProgress = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _checkCtrl, curve: Curves.easeOut));

    // Confetti
    _confettiCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 2200));
    _confettiCtrl.addListener(_updateParticles);

    // Content slide-up
    _slideCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _slideY = Tween<double>(begin: 60, end: 0).animate(
        CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOutCubic));
    _fadeIn = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _slideCtrl, curve: Curves.easeIn));

    // Pulse on success icon
    _pulseCtrl = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 800),
        lowerBound: 1.0,
        upperBound: 1.08)
      ..repeat(reverse: true);
    _pulse = _pulseCtrl;

    _spawnParticles();
    _startSequence();
  }

  void _spawnParticles() {
    for (int i = 0; i < 80; i++) {
      _particles.add(_Particle(
        x: 0.5,
        y: 0.22,
        vx: (_rng.nextDouble() - 0.5) * 0.018,
        vy: -_rng.nextDouble() * 0.025 - 0.005,
        size: _rng.nextDouble() * 9 + 5,
        angle: _rng.nextDouble() * math.pi * 2,
        spin: (_rng.nextDouble() - 0.5) * 0.3,
        opacity: 1.0,
        color: _confettiColors[_rng.nextInt(_confettiColors.length)],
      ));
    }
  }

  void _updateParticles() {
    final t = _confettiCtrl.value;
    setState(() {
      for (final p in _particles) {
        p.x += p.vx;
        p.vy += 0.00045; // gravity
        p.y += p.vy;
        p.angle += p.spin;
        p.opacity = (1.0 - t * 1.1).clamp(0, 1);
      }
    });
  }

  Future<void> _startSequence() async {
    await Future.delayed(const Duration(milliseconds: 100));
    _circleCtrl.forward();
    await Future.delayed(const Duration(milliseconds: 350));
    _checkCtrl.forward();
    _confettiCtrl.forward();
    HapticFeedback.heavyImpact();
    await Future.delayed(const Duration(milliseconds: 200));
    _slideCtrl.forward();
  }

  @override
  void dispose() {
    _circleCtrl.dispose();
    _checkCtrl.dispose();
    _confettiCtrl.dispose();
    _slideCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final nights = du.nightsBetween(
      DateTime.parse(widget.booking.checkin),
      DateTime.parse(widget.booking.checkout),
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        title: const Text(
          'Booking Confirmed',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        automaticallyImplyLeading: false,
      ),
      body: Stack(
        children: [
          // ── Confetti layer ──────────────────────────────────────────────
          AnimatedBuilder(
            animation: _confettiCtrl,
            builder: (_, __) => CustomPaint(
              painter: _ConfettiPainter(_particles),
              size: Size.infinite,
              child: const SizedBox.expand(),
            ),
          ),

          // ── Content ─────────────────────────────────────────────────────
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const SizedBox(height: 24),

                // Animated circle + checkmark
                _buildAnimatedBadge(),

                const SizedBox(height: 16),

                // Slide-up content
                AnimatedBuilder(
                  animation: _slideCtrl,
                  builder: (_, child) => Opacity(
                    opacity: _fadeIn.value,
                    child: Transform.translate(
                      offset: Offset(0, _slideY.value),
                      child: child,
                    ),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'You\'re all set!',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Your booking has been confirmed.',
                        style: TextStyle(fontSize: 14, color: AppColors.muted),
                      ),
                      const SizedBox(height: 28),
                      _buildConfirmationCard(context),
                      const SizedBox(height: 16),
                      _buildDetailsCard(nights),
                      const SizedBox(height: 28),
                      _buildActionButtons(context),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedBadge() {
    return AnimatedBuilder(
      animation: Listenable.merge([_circleCtrl, _checkCtrl, _pulseCtrl]),
      builder: (_, __) {
        return ScaleTransition(
          scale: _circleScale,
          child: Opacity(
            opacity: _circleOpacity.value,
            child: ScaleTransition(
              scale: _pulse,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Outer glow ring
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.success.withValues(alpha: 0.12),
                    ),
                  ),
                  // Inner filled circle
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.success.withValues(alpha: 0.18),
                      border: Border.all(
                          color: AppColors.success.withValues(alpha: 0.4),
                          width: 2),
                    ),
                  ),
                  // Animated checkmark
                  SizedBox(
                    width: 48,
                    height: 48,
                    child: CustomPaint(
                      painter: _CheckmarkPainter(
                        progress: _checkProgress.value,
                        color: AppColors.success,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: () {
              // Go to home — SearchBloc is factory so a fresh one is created
              context.goNamed('home');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              textStyle: const TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w700),
            ),
            child: const Text('Back to Home'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton(
            onPressed: () => context.goNamed('trips'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(color: AppColors.primary),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              textStyle: const TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w700),
            ),
            child: const Text('View My Trips'),
          ),
        ),
      ],
    );
  }

  Widget _buildConfirmationCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
        children: [
          const Text('Confirmation Number',
              style: TextStyle(fontSize: 12, color: AppColors.muted)),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.booking.confirmationNumber,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(
                      text: widget.booking.confirmationNumber));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Copied to clipboard')),
                  );
                },
                child: const Icon(Icons.copy_outlined,
                    size: 18, color: AppColors.muted),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: AppColors.border),
          const SizedBox(height: 12),
          const Text('Check-in PIN',
              style: TextStyle(fontSize: 12, color: AppColors.muted)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: widget.booking.pin.split('').map((d) => Container(
              width: 40,
              height: 48,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.border),
              ),
              child: Center(
                child: Text(d,
                    style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text)),
              ),
            )).toList(),
          ),
          const SizedBox(height: 8),
          const Text('Show this PIN at check-in',
              style: TextStyle(fontSize: 11, color: AppColors.muted)),
        ],
      ),
    );
  }

  Widget _buildDetailsCard(int nights) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
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
          _detailRow(Icons.calendar_today_outlined, 'Check-in',
              du.formatDate(DateTime.parse(widget.booking.checkin))),
          const SizedBox(height: 10),
          _detailRow(Icons.calendar_today_outlined, 'Check-out',
              du.formatDate(DateTime.parse(widget.booking.checkout))),
          const SizedBox(height: 10),
          _detailRow(Icons.nights_stay_outlined, 'Duration',
              du.formatNights(nights)),
          const SizedBox(height: 10),
          _detailRow(
            Icons.person_outline,
            'Guests',
            '${widget.booking.adults} adult${widget.booking.adults != 1 ? 's' : ''}'
                '${widget.booking.children > 0 ? ', ${widget.booking.children} child${widget.booking.children != 1 ? 'ren' : ''}' : ''}',
          ),
          const Divider(height: 20, color: AppColors.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total paid',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text)),
              Text(formatInr(widget.booking.totalPrice),
                  style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.success)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) => Row(
        children: [
          Icon(icon, size: 15, color: AppColors.muted),
          const SizedBox(width: 8),
          Text('$label: ',
              style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text)),
          ),
        ],
      );
}
