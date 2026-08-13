import 'package:intl/intl.dart';

final _inrFormatter = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);

String formatInr(num amount) => _inrFormatter.format(amount);

String formatInrFromString(String? amount) {
  if (amount == null) return '₹--';
  final parsed = double.tryParse(amount);
  if (parsed == null) return '₹--';
  return formatInr(parsed);
}
