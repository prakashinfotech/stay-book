import 'package:intl/intl.dart';

String formatDate(DateTime date) => DateFormat('dd MMM yyyy').format(date);

String formatDateShort(DateTime date) => DateFormat('dd MMM').format(date);

String dateToApiString(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

DateTime apiStringToDate(String s) => DateTime.parse(s);

String todayStr() => dateToApiString(DateTime.now());

String tomorrowStr() =>
    dateToApiString(DateTime.now().add(const Duration(days: 1)));

int nightsBetween(DateTime checkin, DateTime checkout) =>
    checkout.difference(checkin).inDays;

String formatNights(int nights) =>
    '$nights ${nights == 1 ? 'night' : 'nights'}';
