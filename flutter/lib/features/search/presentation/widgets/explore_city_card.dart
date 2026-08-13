import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/network/app_image_cache_manager.dart';
import '../../../../core/utils/image_utils.dart';
import '../../domain/entities/destination_entity.dart';

const _cityImages = {
  'New Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80&auto=format&fit=crop',
  'Mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80&auto=format&fit=crop',
  'Bengaluru': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80&auto=format&fit=crop',
  'Jaipur': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80&auto=format&fit=crop',
  'Goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80&auto=format&fit=crop',
  'Ahmedabad': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80&auto=format&fit=crop',
  'Manali': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80&auto=format&fit=crop',
  'Rishikesh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop',
  'Varanasi': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&q=80&auto=format&fit=crop',
};

class ExploreCityCard extends StatelessWidget {
  final DestinationEntity destination;
  final VoidCallback onTap;

  const ExploreCityCard({
    super.key,
    required this.destination,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = _cityImages[destination.city] ??
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80&auto=format&fit=crop'; // Default India image

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 140,
        height: 100,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.grey[200],
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            fit: StackFit.expand,
            children: [
              CachedNetworkImage(
                imageUrl: proxyImageUrl(imageUrl),
                cacheManager: AppImageCacheManager(),
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: Colors.grey[300],
                  child: const Center(
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: Colors.grey[400],
                  child: const Center(
                    child: Icon(Icons.location_city_rounded,
                        size: 40, color: Colors.white70),
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.7),
                    ],
                    stops: const [0.4, 1.0],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      destination.city,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${destination.count} ${destination.count == 1 ? 'property' : 'properties'}',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
