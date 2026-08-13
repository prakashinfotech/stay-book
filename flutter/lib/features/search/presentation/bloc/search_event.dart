import 'package:equatable/equatable.dart';
import '../../domain/entities/search_params.dart';

abstract class SearchEvent extends Equatable {
  const SearchEvent();
}

class SearchInitialised extends SearchEvent {
  const SearchInitialised();
  @override
  List<Object> get props => [];
}

class SearchSubmitted extends SearchEvent {
  final SearchParams params;
  const SearchSubmitted(this.params);
  @override
  List<Object> get props => [params];
}

class SearchReset extends SearchEvent {
  const SearchReset();
  @override
  List<Object> get props => [];
}
