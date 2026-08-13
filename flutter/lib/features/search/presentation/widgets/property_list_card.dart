import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/network/app_image_cache_manager.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../domain/entities/search_result_entity.dart';

class PropertyListCard extends StatelessWidget {
  final SearchResultEntity property;
  final VoidCallback onTap;

  const PropertyListCard({
    super.key,
    required this.property,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: scheme.outline.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImage(),
            _buildInfo(),
          ],
        ),
      ),
    );
  }

  Widget _buildImage() {
    final hasImage = property.coverImage != null && property.coverImage!.isNotEmpty;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      child: hasImage
          ? CachedNetworkImage(
              imageUrl: proxyImageUrl(property.coverImage),
              cacheManager: AppImageCacheManager(),
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
              httpHeaders: const {'Connection': 'keep-alive'},
              maxHeightDiskCache: 500,
              maxWidthDiskCache: 500,
              placeholder: (context, url) => Container(
                height: 180,
                width: double.infinity,
                color: const Color(0xFFE8EDF5),
                child: const Center(
                  child: SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              ),
              errorWidget: (_, __, ___) => _imagePlaceholder(),
            )
          : _imagePlaceholder(),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      height: 180,
      width: double.infinity,
      color: const Color(0xFFE8EDF5),
      child: const Center(
        child: Icon(Icons.apartment_rounded, size: 48, color: Color(0xFFB0BEC5)),
      ),
    );
  }

  Widget _buildInfo() {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  property.name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (property.starRating != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded,
                        size: 15, color: AppColors.star),
                    const SizedBox(width: 2),
                    Text(
                      property.starRating!.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.text,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.location_on_outlined,
                  size: 13, color: AppColors.muted),
              const SizedBox(width: 2),
              Expanded(
                child: Text(
                  '${property.city} · ${property.address}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.muted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  property.category,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppColors.primary,
                  ),
                ),
              ),
              if (property.minPrice != null)
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: formatInrFromString(property.minPrice),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      const TextSpan(
                        text: ' /night',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.muted,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
