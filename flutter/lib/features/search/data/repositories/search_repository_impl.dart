import 'dart:io';

import 'package:dartz/dartz.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/destination_entity.dart';
import '../../domain/entities/search_params.dart';
import '../../domain/entities/search_result_entity.dart';
import '../../domain/repositories/search_repository.dart';
import '../datasources/search_remote_datasource.dart';

class SearchRepositoryImpl implements SearchRepository {
  final SearchRemoteDataSource _remoteDs;
  SearchRepositoryImpl(this._remoteDs);

  @override
  Future<Either<Failure, SearchPage>> searchProperties(
      SearchParams params) async {
    try {
      final page = await _remoteDs.searchProperties(params);
      return Right(page);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, List<String>>> getSuggestions(String q) async {
    try {
      final list = await _remoteDs.getSuggestions(q);
      return Right(list);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, List<DestinationEntity>>> getDestinationCounts() async {
    try {
      final models = await _remoteDs.getDestinationCounts();
      return Right(models.map((m) => m.toEntity()).toList());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<SearchResultEntity>>> getFeaturedProperties() async {
    try {
      final models = await _remoteDs.getFeaturedProperties();
      return Right(models.map((m) => m.toEntity()).toList());
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } on SocketException {
      return const Left(NetworkFailure());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
