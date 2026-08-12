import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/network/app_image_cache_manager.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../domain/entities/search_result_entity.dart';

class FeaturedPropertyCard extends StatelessWidget {
  final SearchResultEntity property;
  final VoidCallback onTap;

  const FeaturedPropertyCard({
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
        width: 180,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: scheme.outline.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(18)),
              child: (property.coverImage != null && property.coverImage!.isNotEmpty)
                  ? CachedNetworkImage(
                      imageUrl: proxyImageUrl(property.coverImage),
                      cacheManager: AppImageCacheManager(),
                      height: 110,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      httpHeaders: const {'Connection': 'keep-alive'},
                      maxHeightDiskCache: 300,
                      maxWidthDiskCache: 300,
                      placeholder: (context, url) => Container(
                        height: 110,
                        color: const Color(0xFFE8EDF5),
                        child: const Center(
                          child: SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      ),
                      errorWidget: (_, __, ___) => _placeholder(),
                    )
                  : _placeholder(),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    property.name,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 11, color: AppColors.muted),
                      const SizedBox(width: 2),
                      Expanded(
                        child: Text(
                          property.city,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.muted),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (property.starRating != null)
                        Row(
                          children: [
                            const Icon(Icons.star_rounded,
                                size: 12, color: AppColors.star),
                            const SizedBox(width: 2),
                            Text(
                              property.starRating!.toStringAsFixed(1),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.text,
                              ),
                            ),
                          ],
                        )
                      else
                        const SizedBox.shrink(),
                      if (property.minPrice != null)
                        Text(
                          formatInrFromString(property.minPrice),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() => Container(
        height: 110,
        color: const Color(0xFFE8EDF5),
        child: const Center(
          child: Icon(Icons.apartment_rounded,
              size: 36, color: Color(0xFFB0BEC5)),
        ),
      );
}
