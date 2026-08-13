import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_utils.dart' as du;
import '../../../../injection_container.dart';
import '../../domain/entities/search_params.dart';
import '../../domain/usecases/get_suggestions_usecase.dart';
import '../bloc/search_bloc.dart';
import '../bloc/search_event.dart';

class SearchBarWidget extends StatefulWidget {
  final String? initialDestination;

  const SearchBarWidget({super.key, this.initialDestination});

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  final _destCtrl = TextEditingController();
  DateTime _checkin = DateTime.now();
  DateTime _checkout = DateTime.now().add(const Duration(days: 1));
  int _adults = 2;
  List<String> _suggestions = [];
  bool _showSuggestions = false;

  final _suggestionsUseCase = sl<GetSuggestionsUseCase>();

  @override
  void initState() {
    super.initState();
    if (widget.initialDestination != null) {
      _destCtrl.text = widget.initialDestination!;
    }
  }

  @override
  void dispose() {
    _destCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchSuggestions(String q) async {
    if (q.length < 2) {
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
      });
      return;
    }
    final result = await _suggestionsUseCase(q);
    result.fold(
      (_) => {},
      (list) => setState(() {
        _suggestions = list;
        _showSuggestions = list.isNotEmpty;
      }),
    );
  }

  Future<void> _pickDate(bool isCheckin) async {
    // Dismiss keyboard when opening date picker
    FocusScope.of(context).unfocus();
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: isCheckin ? _checkin : _checkout,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.primary,
            onPrimary: Colors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (picked == null) return;
    setState(() {
      if (isCheckin) {
        _checkin = picked;
        if (!_checkout.isAfter(_checkin)) {
          _checkout = _checkin.add(const Duration(days: 1));
        }
      } else {
        if (picked.isAfter(_checkin)) {
          _checkout = picked;
        }
      }
    });
  }

  void _submit() {
    final dest = _destCtrl.text.trim();
    if (dest.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a destination')),
      );
      return;
    }
    // Dismiss keyboard before navigating to results
    FocusScope.of(context).unfocus();
    setState(() => _showSuggestions = false);
    context.read<SearchBloc>().add(
          SearchSubmitted(
            SearchParams(
              destination: dest,
              checkin: du.dateToApiString(_checkin),
              checkout: du.dateToApiString(_checkout),
              adults: _adults,
            ),
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        behavior: HitTestBehavior.opaque,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildDestinationField(),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildDateTile('Check-in', _checkin, true)),
                Container(
                  width: 1,
                  height: 36,
                  color: AppColors.border,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                ),
                Expanded(child: _buildDateTile('Check-out', _checkout, false)),
              ],
            ),
            const SizedBox(height: 12),
            _buildAdultsRow(),
            const SizedBox(height: 14),
            SizedBox(
              height: 46,
              child: ElevatedButton.icon(
                onPressed: _submit,
                icon: const Icon(Icons.search, size: 18),
                label: const Text(
                  'Search',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDestinationField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Destination',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.muted,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: _destCtrl,
          decoration: InputDecoration(
            hintText: 'City, hotel or area…',
            prefixIcon:
                const Icon(Icons.location_on, color: AppColors.primary, size: 20),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            isDense: true,
          ),
          onChanged: _fetchSuggestions,
          onTap: () {
            if (_destCtrl.text.length >= 2) {
              setState(() => _showSuggestions = _suggestions.isNotEmpty);
            }
          },
        ),
        if (_showSuggestions && _suggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 2),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Column(
              children: _suggestions
                  .map(
                    (s) => InkWell(
                      onTap: () {
                        _destCtrl.text = s;
                        setState(() => _showSuggestions = false);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        child: Row(
                          children: [
                            const Icon(Icons.location_city_outlined,
                                size: 14, color: AppColors.muted),
                            const SizedBox(width: 8),
                            Text(s,
                                style: const TextStyle(
                                    fontSize: 13, color: AppColors.text)),
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildDateTile(String label, DateTime date, bool isCheckin) {
    return GestureDetector(
      onTap: () => _pickDate(isCheckin),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.muted,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 13, color: AppColors.primary),
              const SizedBox(width: 4),
              Text(
                du.formatDateShort(date),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAdultsRow() {
    return Row(
      children: [
        const Icon(Icons.person_outline, size: 16, color: AppColors.muted),
        const SizedBox(width: 6),
        const Text(
          'Adults',
          style: TextStyle(fontSize: 13, color: AppColors.muted),
        ),
        const Spacer(),
        _counterButton(
          Icons.remove,
          () => _adults > 1 ? setState(() => _adults--) : null,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            '$_adults',
            style: const TextStyle(
                fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.text),
          ),
        ),
        _counterButton(
          Icons.add,
          () => _adults < 8 ? setState(() => _adults++) : null,
        ),
      ],
    );
  }

  Widget _counterButton(IconData icon, VoidCallback? onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 16, color: AppColors.primary),
      ),
    );
  }
}
