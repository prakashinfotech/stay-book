import 'package:dio/dio.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

/// Custom image cache manager that uses Dio instead of dart:io's HttpClient.
///
/// Fixes Unsplash / CDN image loading failures caused by the default
/// flutter_cache_manager User-Agent ("Dart/x.x (dart:io)") being throttled
/// or rejected by CDNs. Uses the same HTTP stack proven to work for API calls.
class AppImageCacheManager extends CacheManager with ImageCacheManager {
  static const _key = 'staybook_image_cache_v2';
  static final AppImageCacheManager _instance = AppImageCacheManager._();

  factory AppImageCacheManager() => _instance;

  AppImageCacheManager._()
      : super(Config(
          _key,
          stalePeriod: const Duration(days: 7),
          maxNrOfCacheObjects: 300,
          fileService: _DioImageFileService(),
        ));
}

class _DioImageFileService extends FileService {
  final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'User-Agent':
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 '
            '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    ),
  );

  @override
  Future<FileServiceResponse> get(
    String url, {
    Map<String, String>? headers,
  }) async {
    final response = await _dio.get<ResponseBody>(
      url,
      options: Options(
        responseType: ResponseType.stream,
        headers: headers,
        followRedirects: true,
        maxRedirects: 5,
        validateStatus: (status) => status != null && status < 500,
      ),
    );
    return _DioFileServiceResponse(response);
  }
}

class _DioFileServiceResponse implements FileServiceResponse {
  _DioFileServiceResponse(this._response)
      : _downloadedAt = DateTime.now();

  final Response<ResponseBody> _response;
  final DateTime _downloadedAt;

  @override
  int get statusCode => _response.statusCode ?? 200;

  @override
  Stream<List<int>> get content =>
      _response.data!.stream.cast<List<int>>();

  @override
  int? get contentLength {
    final header = _response.headers.value('content-length');
    return header != null ? int.tryParse(header) : null;
  }

  @override
  String? get eTag => _response.headers.value('etag');

  @override
  String get fileExtension {
    final ct = _response.headers.value('content-type') ?? '';
    if (ct.contains('jpeg') || ct.contains('jpg')) return '.jpg';
    if (ct.contains('png')) return '.png';
    if (ct.contains('webp')) return '.webp';
    if (ct.contains('gif')) return '.gif';
    return '.jpg';
  }

  @override
  DateTime get validTill => _downloadedAt.add(const Duration(days: 7));
}
