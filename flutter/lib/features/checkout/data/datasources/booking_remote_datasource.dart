import 'package:dio/dio.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/booking_model.dart';
import '../models/hold_response_model.dart';
import '../models/payment_order_model.dart';

abstract class BookingRemoteDataSource {
  Future<HoldResponseModel> createHold({
    required String roomTypeId,
    required String propertyId,
    required String checkin,
    required String checkout,
    required int adults,
    required int children,
  });

  Future<BookingModel> createBooking({
    required String holdId,
    String? ratePlanId,
    required int adults,
    required int children,
    required Map<String, dynamic> guestDetails,
    required Map<String, dynamic> payment,
  });

  Future<PaymentOrderModel> createPaymentOrder({
    required double amountInRupees,
    required String holdId,
  });
}

class BookingRemoteDataSourceImpl implements BookingRemoteDataSource {
  final Dio _dio;
  const BookingRemoteDataSourceImpl(this._dio);

  @override
  Future<HoldResponseModel> createHold({
    required String roomTypeId,
    required String propertyId,
    required String checkin,
    required String checkout,
    required int adults,
    required int children,
  }) async {
    try {
      final response = await _dio.post(
        '/bookings/hold',
        data: {
          'roomTypeId': roomTypeId,
          'propertyId': propertyId,
          'checkin': checkin,
          'checkout': checkout,
          'adults': adults,
          'children': children,
        },
      );
      final data = response.data['data'] as Map<String, dynamic>;
      return HoldResponseModel.fromJson(data);
    } on DioException catch (e) {
      final msg = e.response?.data['error']?['message'] as String? ??
          e.response?.data['message'] as String? ??
          'Failed to create hold';
      throw ServerException(msg, e.response?.statusCode);
    }
  }

  @override
  Future<BookingModel> createBooking({
    required String holdId,
    String? ratePlanId,
    required int adults,
    required int children,
    required Map<String, dynamic> guestDetails,
    required Map<String, dynamic> payment,
  }) async {
    try {
      final body = <String, dynamic>{
        'holdId': holdId,
        'adults': adults,
        'children': children,
        'guestDetails': guestDetails,
        'payment': payment,
      };
      if (ratePlanId != null) body['ratePlanId'] = ratePlanId;

      final response = await _dio.post('/bookings', data: body);
      final data = response.data['data'] as Map<String, dynamic>;
      return BookingModel.fromJson(data);
    } on DioException catch (e) {
      final msg = e.response?.data['error']?['message'] as String? ??
          e.response?.data['message'] as String? ??
          'Booking failed';
      throw ServerException(msg, e.response?.statusCode);
    }
  }

  @override
  Future<PaymentOrderModel> createPaymentOrder({
    required double amountInRupees,
    required String holdId,
  }) async {
    try {
      final response = await _dio.post(
        '/payments/create-order',
        data: {
          'amount': amountInRupees, // rupees — server converts to paise
          'holdId': holdId,
        },
      );
      final data = response.data['data'] as Map<String, dynamic>;
      return PaymentOrderModel.fromJson(data);
    } on DioException catch (e) {
      final msg = e.response?.data['error']?['message'] as String? ??
          e.response?.data['message'] as String? ??
          'Failed to create payment order';
      throw ServerException(msg, e.response?.statusCode);
    }
  }
}
