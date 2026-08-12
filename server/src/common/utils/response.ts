import { Response } from 'express';

export function ok<T>(res: Response, data: T, message = 'Success'): void {
  res.status(200).json({ statusCode: 200, data, message });
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ statusCode: 201, data, message: 'Created' });
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
): void {
  res.status(200).json({
    statusCode: 200,
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
