import 'package:dio/dio.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/property_model.dart';

abstract class PropertyRemoteDataSource {
  Future<PropertyModel> getById(String id);
}

class PropertyRemoteDataSourceImpl implements PropertyRemoteDataSource {
  final Dio _dio;
  PropertyRemoteDataSourceImpl(this._dio);

  String _extractError(dynamic body) {
    if (body is Map) {
      final err = body['error'];
      if (err is Map && err['message'] != null) return err['message'] as String;
      if (body['message'] != null) return body['message'] as String;
    }
    return 'Something went wrong';
  }

  @override
  Future<PropertyModel> getById(String id) async {
    try {
      final res = await _dio.get('/properties/$id');
      return PropertyModel.fromJson(
        res.data['data'] as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }
}
