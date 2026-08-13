import 'package:dio/dio.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/booking_list_item_model.dart';

abstract class TripsRemoteDataSource {
  Future<List<BookingListItemModel>> getMyBookings({int page, int limit});
  Future<BookingListItemModel> cancelBooking(String id);
}

class TripsRemoteDataSourceImpl implements TripsRemoteDataSource {
  final Dio _dio;
  const TripsRemoteDataSourceImpl(this._dio);

  @override
  Future<List<BookingListItemModel>> getMyBookings({
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _dio.get(
        '/bookings',
        queryParameters: {'page': page, 'limit': limit},
      );
      final outer = response.data['data'];
      final List<dynamic> items;
      if (outer is Map) {
        items = outer['data'] as List<dynamic>;
      } else {
        items = outer as List<dynamic>;
      }
      return items
          .map((e) => BookingListItemModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final msg = e.response?.data['error']?['message'] as String? ??
          e.response?.data['message'] as String? ??
          'Failed to load trips';
      throw ServerException(msg, e.response?.statusCode);
    }
  }

  @override
  Future<BookingListItemModel> cancelBooking(String id) async {
    try {
      final response = await _dio.post('/bookings/$id/cancel');
      final data = response.data['data'] as Map<String, dynamic>? ??
          response.data as Map<String, dynamic>;
      return BookingListItemModel.fromJson(data);
    } on DioException catch (e) {
      final msg = e.response?.data['error']?['message'] as String? ??
          e.response?.data['message'] as String? ??
          'Failed to cancel booking';
      throw ServerException(msg, e.response?.statusCode);
    }
  }
}
