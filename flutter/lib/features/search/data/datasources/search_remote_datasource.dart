import 'package:dio/dio.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/destination_model.dart';
import '../models/search_result_model.dart';
import '../../domain/entities/search_params.dart';
import '../../domain/repositories/search_repository.dart';

abstract class SearchRemoteDataSource {
  Future<SearchPage> searchProperties(SearchParams params);
  Future<List<String>> getSuggestions(String q);
  Future<List<DestinationModel>> getDestinationCounts();
  Future<List<SearchResultModel>> getFeaturedProperties();
}

class SearchRemoteDataSourceImpl implements SearchRemoteDataSource {
  final Dio _dio;
  SearchRemoteDataSourceImpl(this._dio);

  String _extractError(dynamic body) {
    if (body is Map) {
      final err = body['error'];
      if (err is Map && err['message'] != null) return err['message'] as String;
      if (body['message'] != null) return body['message'] as String;
    }
    return 'Something went wrong';
  }

  @override
  Future<SearchPage> searchProperties(SearchParams params) async {
    try {
      final res = await _dio.get(
        '/search',
        queryParameters: {
          'destination': params.destination,
          'checkin': params.checkin,
          'checkout': params.checkout,
          'adults': params.adults,
          'page': params.page,
          'limit': params.limit,
          if (params.category != null) 'category': params.category,
        },
      );
      final data = (res.data['data'] as List)
          .map((e) => SearchResultModel.fromJson(e as Map<String, dynamic>))
          .toList();
      final meta = res.data['meta'] as Map<String, dynamic>;
      return SearchPage(
        results: data.map((m) => m.toEntity()).toList(),
        total: (meta['total'] as num).toInt(),
        page: (meta['page'] as num).toInt(),
        limit: (meta['limit'] as num).toInt(),
        totalPages: (meta['totalPages'] as num).toInt(),
      );
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }

  @override
  Future<List<String>> getSuggestions(String q) async {
    try {
      final res =
          await _dio.get('/search/suggestions', queryParameters: {'q': q});
      return (res.data['data'] as List).cast<String>();
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }

  @override
  Future<List<DestinationModel>> getDestinationCounts() async {
    try {
      final res = await _dio.get('/search/destinations');
      return (res.data['data'] as List)
          .map((e) => DestinationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }

  @override
  Future<List<SearchResultModel>> getFeaturedProperties() async {
    try {
      final res = await _dio.get('/properties/featured');
      final data = res.data['data'];
      final list = data is List ? data : (data as Map)['data'] as List;
      return list
          .map((e) => SearchResultModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ServerException(
        _extractError(e.response?.data),
        e.response?.statusCode,
      );
    }
  }
}
