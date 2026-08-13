import { PropertiesRepository } from './properties.repository';
import { CreatePropertyDto, UpdatePropertyDto, AddRoomTypeDto, AddImagesDto, CreateRatePlanDto } from './properties.schema';
import { AppError, NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';

export class PropertiesService {
  private readonly repo = new PropertiesRepository();

  async create(ownerId: string, dto: CreatePropertyDto) {
    try {
      const property = await this.repo.create(ownerId, dto);
      logger.info('Property created', { propertyId: property.id, ownerId });
      return property;
    } catch (error) {
      logger.error('Failed to create property', { error, ownerId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'PROPERTY_CREATE_FAILED', 'Failed to create property');
    }
  }

  async getById(id: string) {
    const property = await this.repo.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    return property;
  }

  async getAvailability(propertyId: string, year: number, month: number) {
    const property = await this.repo.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.status !== 'ACTIVE') throw new ForbiddenError('Property is not available');

    try {
      return await this.repo.getAvailability(propertyId, year, month);
    } catch (error) {
      logger.error('Failed to get availability', { error, propertyId, year, month });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'AVAILABILITY_FAILED', 'Failed to get availability');
    }
  }

  async update(id: string, userId: string, dto: UpdatePropertyDto) {
    const property = await this.repo.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');
    try {
      const updated = await this.repo.update(id, dto);
      logger.info('Property updated', { propertyId: id, userId });
      return updated;
    } catch (error) {
      logger.error('Failed to update property', { error, propertyId: id });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'PROPERTY_UPDATE_FAILED', 'Failed to update property');
    }
  }

  async addRoomType(propertyId: string, userId: string, dto: AddRoomTypeDto) {
    const property = await this.repo.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');
    try {
      const roomType = await this.repo.addRoomType(propertyId, dto);
      logger.info('Room type added', { propertyId, roomTypeId: roomType.id, userId });
      return roomType;
    } catch (error) {
      logger.error('Failed to add room type', { error, propertyId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'ROOM_TYPE_CREATE_FAILED', 'Failed to add room type');
    }
  }

  async addImages(propertyId: string, userId: string, dto: AddImagesDto) {
    const property = await this.repo.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');
    try {
      const result = await this.repo.addImages(propertyId, dto);
      logger.info('Images added', { propertyId, count: result.count, userId });
      return result;
    } catch (error) {
      logger.error('Failed to add images', { error, propertyId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'IMAGES_CREATE_FAILED', 'Failed to save images');
    }
  }

  async getFeatured() {
    try {
      return await this.repo.getFeatured();
    } catch (error) {
      logger.error('Failed to get featured properties', { error });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'FEATURED_FAILED', 'Failed to load featured properties');
    }
  }

  async publish(id: string, userId: string) {
    const property = await this.repo.findById(id);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');
    if (property.status === 'PENDING_REVIEW' || property.status === 'ACTIVE') {
      throw new ConflictError('Property is already submitted for review or published');
    }
    const kyc = await this.repo.getKycByPropertyId(id);
    if (!kyc) {
      throw new BadRequestError('Please submit your KYC information before publishing this property');
    }
    try {
      const updated = await this.repo.publish(id);
      logger.info('Property submitted for review', { propertyId: id, userId });
      return { ...updated, message: 'Property submitted for review. It will go live once approved by admin.' };
    } catch (error) {
      logger.error('Failed to submit property for review', { error, propertyId: id });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'PROPERTY_SUBMIT_FAILED', 'Failed to submit property for review');
    }
  }

  async getRatePlans(propertyId: string, roomTypeId: string, userId: string) {
    const property = await this.repo.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');

    const roomType = property.roomTypes.find(r => r.id === roomTypeId);
    if (!roomType) throw new NotFoundError('Room type not found');

    return this.repo.getRatePlans(roomTypeId);
  }

  async createRatePlan(propertyId: string, roomTypeId: string, userId: string, dto: CreateRatePlanDto) {
    const property = await this.repo.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');

    const roomType = property.roomTypes.find(r => r.id === roomTypeId);
    if (!roomType) throw new NotFoundError('Room type not found');

    const existing = roomType.ratePlans.find(rp => rp.planType === dto.planType);
    if (existing) throw new ConflictError(`${dto.planType} rate plan already exists for this room`);

    try {
      const plan = await this.repo.createRatePlan(roomTypeId, dto);
      logger.info('Rate plan created', { propertyId, roomTypeId, planType: dto.planType, userId });
      return plan;
    } catch (error) {
      logger.error('Failed to create rate plan', { error, roomTypeId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'RATE_PLAN_CREATE_FAILED', 'Failed to create rate plan');
    }
  }

  async deleteRatePlan(propertyId: string, roomTypeId: string, ratePlanId: string, userId: string) {
    const property = await this.repo.findById(propertyId);
    if (!property) throw new NotFoundError('Property not found');
    if (property.ownerId !== userId) throw new ForbiddenError('You do not own this property');

    const roomType = property.roomTypes.find(r => r.id === roomTypeId);
    if (!roomType) throw new NotFoundError('Room type not found');

    const plan = roomType.ratePlans.find(rp => rp.id === ratePlanId);
    if (!plan) throw new NotFoundError('Rate plan not found');
    if (plan.planType === 'STANDARD') throw new BadRequestError('STANDARD rate plan cannot be deleted');

    try {
      await this.repo.deleteRatePlan(ratePlanId);
      logger.info('Rate plan deleted', { propertyId, roomTypeId, ratePlanId, userId });
    } catch (error) {
      logger.error('Failed to delete rate plan', { error, ratePlanId });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'RATE_PLAN_DELETE_FAILED', 'Failed to delete rate plan');
    }
  }
}
