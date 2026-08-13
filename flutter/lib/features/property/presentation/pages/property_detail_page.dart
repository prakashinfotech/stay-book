import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/network/app_image_cache_manager.dart';
import '../../../../core/utils/image_utils.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_utils.dart' as du;
import '../../../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../../../features/auth/presentation/bloc/auth_state.dart';
import '../../domain/entities/property_entity.dart';
import '../cubit/property_cubit.dart';
import '../widgets/amenity_chip.dart';
import '../widgets/room_type_card.dart';

class PropertyDetailPage extends StatefulWidget {
  final String id;
  final String? checkin;
  final String? checkout;
  final int adults;

  const PropertyDetailPage({
    super.key,
    required this.id,
    this.checkin,
    this.checkout,
    this.adults = 2,
  });

  @override
  State<PropertyDetailPage> createState() => _PropertyDetailPageState();
}

class _PropertyDetailPageState extends State<PropertyDetailPage> {
  int _imageIndex = 0;

  String get _checkin =>
      widget.checkin ?? du.todayStr();
  String get _checkout =>
      widget.checkout ?? du.tomorrowStr();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PropertyCubit, PropertyState>(
      builder: (context, state) {
        return Scaffold(
          body: switch (state) {
            PropertyLoading() || PropertyInitial() => _buildLoading(),
            PropertyError(:final message) => _buildError(message),
            PropertyLoaded(:final property) => _buildContent(property),
            _ => _buildLoading(),
          },
        );
      },
    );
  }

  Widget _buildLoading() {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }

  Widget _buildError(String message) {
    return Scaffold(
      appBar: AppBar(),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56, color: AppColors.danger),
            const SizedBox(height: 12),
            Text(message,
                style: const TextStyle(color: AppColors.muted),
                textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () =>
                  context.read<PropertyCubit>().load(widget.id),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(PropertyEntity property) {
    return CustomScrollView(
      slivers: [
        _buildImageAppBar(property),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(property),
                const SizedBox(height: 16),
                if (property.description != null) ...[
                  _buildSection('About', _buildDescription(property)),
                  const SizedBox(height: 16),
                ],
                if (property.amenities.isNotEmpty) ...[
                  _buildSection('Amenities', _buildAmenities(property)),
                  const SizedBox(height: 16),
                ],
                _buildSection(
                    'Available Rooms', _buildRooms(property)),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImageAppBar(PropertyEntity property) {
    if (property.images.isEmpty) {
      return SliverAppBar(
        expandedHeight: 240,
        pinned: true,
        backgroundColor: AppColors.primary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.goNamed('home');
            }
          },
        ),
        flexibleSpace: FlexibleSpaceBar(
          background: Container(
            color: const Color(0xFFE8EDF5),
            child: const Center(
              child: Icon(Icons.apartment_rounded,
                  size: 64, color: Color(0xFFB0BEC5)),
            ),
          ),
        ),
      );
    }

    return SliverAppBar(
      expandedHeight: 260,
      pinned: true,
      backgroundColor: AppColors.primary,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.goNamed('home');
          }
        },
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          children: [
            PageView.builder(
              itemCount: property.images.length,
              onPageChanged: (i) => setState(() => _imageIndex = i),
              itemBuilder: (_, i) => CachedNetworkImage(
                imageUrl: proxyImageUrl(property.images[i].url),
                cacheManager: AppImageCacheManager(),
                fit: BoxFit.cover,
                width: double.infinity,
                placeholder: (context, url) =>
                    Container(color: const Color(0xFFE8EDF5)),
                errorWidget: (_, __, ___) =>
                    Container(color: const Color(0xFFE8EDF5)),
              ),
            ),
            if (property.images.length > 1)
              Positioned(
                bottom: 12,
                right: 16,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${_imageIndex + 1} / ${property.images.length}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(PropertyEntity property) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                property.name,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
            ),
            if (property.starRating != null) ...[
              const SizedBox(width: 8),
              Row(
                children: [
                  const Icon(Icons.star_rounded,
                      color: AppColors.star, size: 18),
                  const SizedBox(width: 3),
                  Text(
                    property.starRating!.toStringAsFixed(1),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            const Icon(Icons.location_on_outlined,
                size: 14, color: AppColors.muted),
            const SizedBox(width: 3),
            Expanded(
              child: Text(
                '${property.city} · ${property.address}',
                style:
                    const TextStyle(fontSize: 13, color: AppColors.muted),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _headerBadge(property.category, AppColors.primary),
            const SizedBox(width: 8),
            _headerBadge(
              property.bookingMode == 'INSTANT'
                  ? 'Instant booking'
                  : 'On request',
              property.bookingMode == 'INSTANT'
                  ? AppColors.success
                  : AppColors.muted,
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              _dateInfo('Check-in', du.formatDate(DateTime.parse(_checkin))),
              const SizedBox(width: 16),
              Container(width: 1, height: 32, color: AppColors.border),
              const SizedBox(width: 16),
              _dateInfo(
                  'Check-out', du.formatDate(DateTime.parse(_checkout))),
              const Spacer(),
              _dateInfo('Guests', '${widget.adults} adults'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _headerBadge(String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      );

  Widget _dateInfo(String label, String value) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style:
                  const TextStyle(fontSize: 10, color: AppColors.muted)),
          const SizedBox(height: 2),
          Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text)),
        ],
      );

  Widget _buildSection(String title, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.text,
          ),
        ),
        const SizedBox(height: 10),
        child,
      ],
    );
  }

  Widget _buildDescription(PropertyEntity property) {
    return Text(
      property.description!,
      style: const TextStyle(
          fontSize: 14, color: AppColors.muted, height: 1.5),
    );
  }

  Widget _buildAmenities(PropertyEntity property) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: property.amenities
          .map((a) => AmenityChip(label: a))
          .toList(),
    );
  }

  Widget _buildRooms(PropertyEntity property) {
    if (property.roomTypes.isEmpty) {
      return const Text(
        'No rooms available for these dates.',
        style: TextStyle(color: AppColors.muted),
      );
    }

    return Column(
      children: property.roomTypes
          .map(
            (rt) => RoomTypeCard(
              roomType: rt,
              onReserve: () => _onReserve(property, rt),
            ),
          )
          .toList(),
    );
  }

  void _onReserve(PropertyEntity property, RoomTypeEntity roomType) {
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) {
      context.goNamed('login');
      return;
    }

    context.pushNamed(
      'guestDetails',
      extra: {
        'roomTypeId': roomType.id,
        'ratePlanId': roomType.defaultPlan?.id,
        'propertyId': property.id,
        'propertyName': property.name,
        'roomTypeName': roomType.name,
        'basePrice': roomType.basePrice,
        'checkin': _checkin,
        'checkout': _checkout,
        'adults': widget.adults,
        'children': 0,
      },
    );
  }
}
