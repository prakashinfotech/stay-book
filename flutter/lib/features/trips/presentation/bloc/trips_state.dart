part of 'trips_bloc.dart';

abstract class TripsState extends Equatable {
  const TripsState();
}

class TripsInitial extends TripsState {
  const TripsInitial();
  @override
  List<Object?> get props => [];
}

class TripsLoading extends TripsState {
  const TripsLoading();
  @override
  List<Object?> get props => [];
}

class TripsLoaded extends TripsState {
  final List<BookingListItemEntity> all;
  final String? cancellingId;
  final String? cancelError;

  const TripsLoaded(
    this.all, {
    this.cancellingId,
    this.cancelError,
  });

  List<BookingListItemEntity> get upcoming =>
      all.where((b) => b.isUpcoming).toList();

  List<BookingListItemEntity> get past =>
      all.where((b) => b.isPast).toList();

  List<BookingListItemEntity> get cancelled =>
      all.where((b) => b.isCancelled).toList();

  TripsLoaded copyWith({
    List<BookingListItemEntity>? all,
    String? cancellingId,
    bool clearCancelling = false,
    String? cancelError,
    bool clearError = false,
  }) =>
      TripsLoaded(
        all ?? this.all,
        cancellingId: clearCancelling ? null : (cancellingId ?? this.cancellingId),
        cancelError: clearError ? null : (cancelError ?? this.cancelError),
      );

  @override
  List<Object?> get props => [all, cancellingId, cancelError];
}

class TripsError extends TripsState {
  final String message;
  const TripsError(this.message);
  @override
  List<Object?> get props => [message];
}
