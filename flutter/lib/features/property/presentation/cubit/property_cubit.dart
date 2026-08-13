import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/property_entity.dart';
import '../../domain/usecases/get_property_detail_usecase.dart';

part 'property_state.dart';

class PropertyCubit extends Cubit<PropertyState> {
  final GetPropertyDetailUseCase _getProperty;
  PropertyCubit(this._getProperty) : super(const PropertyInitial());

  Future<void> load(String id) async {
    emit(const PropertyLoading());
    final result = await _getProperty(id);
    result.fold(
      (failure) => emit(PropertyError(failure.message)),
      (property) => emit(PropertyLoaded(property)),
    );
  }
}
