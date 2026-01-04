import {
  Controller,
  All,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @All('auth/*')
  async proxyAuth(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      // Extract path: req.path will be /api/v1/auth/register (with global prefix)
      // We need to convert it to /auth/register for the auth service
      let path = req.path;

      // Remove /api/v1 prefix if present, then ensure /auth prefix
      if (path.startsWith('/api/v1/auth')) {
        path = path.replace('/api/v1/auth', '/auth');
      } else if (!path.startsWith('/auth')) {
        // Fallback: add /auth prefix if not present
        path = `/auth${path}`;
      }

      // Preserve query string if present
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        path = `${path}?${queryString}`;
      }

      console.log(
        `[Gateway] Proxying ${req.method} ${req.path} -> ${path} to auth service`,
      );

      const result = await this.gatewayService.proxyRequest({
        service: 'auth',
        path,
        method: req.method,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
        query: req.query as Record<string, string | string[] | undefined>,
      });

      // Set response headers
      if (result.headers) {
        Object.keys(result.headers).forEach((key) => {
          const value = result.headers[key];
          if (key.toLowerCase() !== 'content-length' && value) {
            if (Array.isArray(value)) {
              res.setHeader(key, value);
            } else {
              res.setHeader(key, value);
            }
          }
        });
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
      }
    }
  }

  @All('tables')
  async proxyTablesExact(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.proxyTables(req, res);
  }

  @All('tables/*')
  async proxyTablesWildcard(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.proxyTables(req, res);
  }

  private async proxyTables(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Extract path: req.path will be /api/v1/tables/... (with global prefix)
      // We need to convert it to /api/v1/tables/... for the table service
      let path = req.path;

      // Remove /api/v1 prefix if present, then ensure /api/v1/tables prefix
      if (path.startsWith('/api/v1/tables')) {
        // Keep the path as is since table service also uses /api/v1 prefix
        // No need to reassign path = path (self-assignment)
      } else if (path.startsWith('/tables')) {
        // Add /api/v1 prefix if missing
        path = `/api/v1${path}`;
      } else {
        // Fallback: add /api/v1/tables prefix if not present
        path = `/api/v1/tables${path}`;
      }

      // Preserve query string if present
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        path = `${path}?${queryString}`;
      }

      console.log(
        `[Gateway] Proxying ${req.method} ${req.path} -> ${path} to table service`,
      );

      const result = await this.gatewayService.proxyRequest({
        service: 'tables',
        path,
        method: req.method,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
        query: req.query as Record<string, string | string[] | undefined>,
      });

      // Set response headers
      if (result.headers) {
        Object.keys(result.headers).forEach((key) => {
          const value = result.headers[key];
          if (key.toLowerCase() !== 'content-length' && value) {
            if (Array.isArray(value)) {
              res.setHeader(key, value);
            } else {
              res.setHeader(key, value);
            }
          }
        });
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
      }
    }
  }

  @All('orders')
  async proxyOrdersExact(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.proxyOrders(req, res);
  }

  @All('orders/*')
  async proxyOrdersWildcard(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.proxyOrders(req, res);
  }

  private async proxyOrders(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Extract path: req.path will be /api/v1/orders/... (with global prefix)
      // We need to convert it to /api/v1/orders/... for the order service
      let path = req.path;

      // Remove /api/v1 prefix if present, then ensure /api/v1/orders prefix
      if (path.startsWith('/api/v1/orders')) {
        // Keep the path as is since order service also uses /api/v1 prefix
      } else if (path.startsWith('/orders')) {
        // Add /api/v1 prefix if missing
        path = `/api/v1${path}`;
      } else {
        // Fallback: add /api/v1/orders prefix if not present
        path = `/api/v1/orders${path}`;
      }

      // Preserve query string if present
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        path = `${path}?${queryString}`;
      }

      console.log(
        `[Gateway] Proxying ${req.method} ${req.path} -> ${path} to order service`,
      );

      const result = await this.gatewayService.proxyRequest({
        service: 'orders',
        path,
        method: req.method,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
        query: req.query as Record<string, string | string[] | undefined>,
      });

      // Set response headers
      if (result.headers) {
        Object.keys(result.headers).forEach((key) => {
          const value = result.headers[key];
          if (key.toLowerCase() !== 'content-length' && value) {
            if (Array.isArray(value)) {
              res.setHeader(key, value);
            } else {
              res.setHeader(key, value);
            }
          }
        });
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
      }
    }
  }

  @All('food')
  async proxyFoodExact(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.proxyFood(req, res);
  }

  @All('food/*')
  async proxyFoodWildcard(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return this.proxyFood(req, res);
  }

  private async proxyFood(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Extract path: req.path will be /api/v1/food/... (with global prefix)
      // We need to convert it to /api/v1/food/... for the food service
      let path = req.path;

      // Remove /api/v1 prefix if present, then ensure /api/v1/food prefix
      if (path.startsWith('/api/v1/food')) {
        // Keep the path as is since food service also uses /api/v1 prefix
      } else if (path.startsWith('/food')) {
        // Add /api/v1 prefix if missing
        path = `/api/v1${path}`;
      } else {
        // Fallback: add /api/v1/food prefix if not present
        path = `/api/v1/food${path}`;
      }

      // Preserve query string if present
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        path = `${path}?${queryString}`;
      }

      console.log(
        `[Gateway] Proxying ${req.method} ${req.path} -> ${path} to food service`,
      );

      const result = await this.gatewayService.proxyRequest({
        service: 'food',
        path,
        method: req.method,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
        query: req.query as Record<string, string | string[] | undefined>,
      });

      // Set response headers
      if (result.headers) {
        Object.keys(result.headers).forEach((key) => {
          const value = result.headers[key];
          if (key.toLowerCase() !== 'content-length' && value) {
            if (Array.isArray(value)) {
              res.setHeader(key, value);
            } else {
              res.setHeader(key, value);
            }
          }
        });
      }

      res.status(result.status).json(result.data);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
      }
    }
  }
}
