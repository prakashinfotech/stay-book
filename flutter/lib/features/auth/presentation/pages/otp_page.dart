import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/gradient_button.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class OtpPage extends StatefulWidget {
  final String userId;
  final String? devOtp;
  final String? email;

  const OtpPage({
    super.key,
    required this.userId,
    this.devOtp,
    this.email,
  });

  @override
  State<OtpPage> createState() => _OtpPageState();
}

class _OtpPageState extends State<OtpPage> {
  static const int _length = 6;
  final List<TextEditingController> _controllers =
      List.generate(_length, (_) => TextEditingController());
  final List<FocusNode> _focusNodes =
      List.generate(_length, (_) => FocusNode());

  @override
  void initState() {
    super.initState();
    if (widget.devOtp != null && widget.devOtp!.length == _length) {
      for (var i = 0; i < _length; i++) {
        _controllers[i].text = widget.devOtp![i];
      }
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _code => _controllers.map((c) => c.text).join();

  void _submit() {
    if (_code.length == _length) {
      context.read<AuthBloc>().add(
            OtpSubmitted(userId: widget.userId, code: _code),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          context.goNamed('home');
        } else if (state is AuthError) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.danger,
              ),
            );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildHeader(),
                    const SizedBox(height: 40),
                    _buildOtpBoxes(),
                    if (widget.devOtp != null) ...[
                      const SizedBox(height: 12),
                      _buildDevHint(),
                    ],
                    const SizedBox(height: 32),
                    _buildVerifyButton(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        const Icon(Icons.mark_email_read_outlined,
            size: 56, color: AppColors.primary),
        const SizedBox(height: 16),
        const Text(
          'Verify your email',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppColors.text,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          widget.email != null
              ? "We sent a 6-digit code to\n${widget.email}"
              : "We sent a 6-digit verification code to your email.",
          style: const TextStyle(fontSize: 14, color: AppColors.muted),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildOtpBoxes() {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(_length, (i) {
        return Container(
          width: 48,
          height: 56,
          margin: EdgeInsets.only(right: i < _length - 1 ? 10 : 0),
          child: TextFormField(
            controller: _controllers[i],
            focusNode: _focusNodes[i],
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: scheme.onSurface,
            ),
            decoration: InputDecoration(
              counterText: '',
              contentPadding: EdgeInsets.zero,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: scheme.outline),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: scheme.primary, width: 2),
              ),
              filled: true,
              fillColor: scheme.surface,
            ),
            onChanged: (value) {
              if (value.length == 1 && i < _length - 1) {
                _focusNodes[i + 1].requestFocus();
              } else if (value.isEmpty && i > 0) {
                _focusNodes[i - 1].requestFocus();
              }
              if (_code.length == _length) _submit();
            },
          ),
        );
      }),
    );
  }

  Widget _buildDevHint() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFFFCC00)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.info_outline,
              size: 14, color: Color(0xFF856404)),
          const SizedBox(width: 6),
          Text(
            'Dev OTP: ${widget.devOtp}',
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF856404),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifyButton() {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final isLoading = state is AuthLoading;
        return GradientButton(
          onPressed: isLoading ? null : _submit,
          label: 'Verify Email',
          loading: isLoading,
        );
      },
    );
  }
}
