part of 'trips_bloc.dart';

abstract class TripsEvent extends Equatable {
  const TripsEvent();
}

class TripsInitialised extends TripsEvent {
  const TripsInitialised();
  @override
  List<Object?> get props => [];
}

class CancelBookingRequested extends TripsEvent {
  final String bookingId;
  const CancelBookingRequested(this.bookingId);
  @override
  List<Object?> get props => [bookingId];
}
