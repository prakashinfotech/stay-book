import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/booking_list_item_entity.dart';
import '../../domain/usecases/cancel_booking_usecase.dart';
import '../../domain/usecases/get_my_bookings_usecase.dart';

part 'trips_event.dart';
part 'trips_state.dart';

class TripsBloc extends Bloc<TripsEvent, TripsState> {
  final GetMyBookingsUseCase _getMyBookings;
  final CancelBookingUseCase _cancelBooking;

  TripsBloc(this._getMyBookings, this._cancelBooking)
      : super(const TripsInitial()) {
    on<TripsInitialised>(_onInit);
    on<CancelBookingRequested>(_onCancel);
  }

  Future<void> _onInit(
      TripsInitialised event, Emitter<TripsState> emit) async {
    emit(const TripsLoading());
    final result = await _getMyBookings();
    result.fold(
      (failure) => emit(TripsError(failure.message)),
      (bookings) => emit(TripsLoaded(bookings)),
    );
  }

  Future<void> _onCancel(
      CancelBookingRequested event, Emitter<TripsState> emit) async {
    if (state is! TripsLoaded) return;
    final current = state as TripsLoaded;
    emit(current.copyWith(cancellingId: event.bookingId, clearError: true));

    final result = await _cancelBooking(event.bookingId);
    result.fold(
      (failure) => emit(current.copyWith(
        clearCancelling: true,
        cancelError: failure.message,
      )),
      (cancelled) {
        final updated = current.all
            .map((b) =>
                b.id == cancelled.id ? b.copyWithStatus('CANCELLED') : b)
            .toList();
        emit(TripsLoaded(updated));
      },
    );
  }
}
