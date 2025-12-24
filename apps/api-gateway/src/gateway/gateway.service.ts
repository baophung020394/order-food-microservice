import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface ProxyResponse {
  data: unknown;
  status: number;
  headers: Record<string, string | string[] | undefined>;
}

export interface ProxyRequestParams {
  service: string;
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

@Injectable()
export class GatewayService {
  private readonly authServiceUrl: string;
  private readonly tableServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://localhost:3001',
    );
    this.tableServiceUrl = this.configService.get<string>(
      'TABLE_SERVICE_URL',
      'http://localhost:3002',
    );
    console.log(
      `[GatewayService] Initialized with AUTH_SERVICE_URL: ${this.authServiceUrl}`,
    );
    console.log(
      `[GatewayService] Initialized with TABLE_SERVICE_URL: ${this.tableServiceUrl}`,
    );
  }

  async proxyRequest({
    service,
    path,
    method,
    headers,
    body,
    query,
  }: ProxyRequestParams): Promise<ProxyResponse> {
    let serviceUrl: string;

    // Map service names to URLs
    switch (service) {
      case 'auth':
        serviceUrl = this.authServiceUrl;
        break;
      case 'tables':
        serviceUrl = this.tableServiceUrl;
        break;
      // Add more services as they are created
      // case 'order':
      //   serviceUrl = this.orderServiceUrl;
      //   break;
      default:
        throw new HttpException(
          `Service ${service} not found`,
          HttpStatus.NOT_FOUND,
        );
    }

    const url = `${serviceUrl}${path}`;
    console.log(`[GatewayService] Proxying ${method} ${url}`);
    console.log(`[GatewayService] Body:`, body);
    console.log(`[GatewayService] Query:`, query);

    // Clean headers for proxying
    const cleanHeaders: Record<string, string> = {};
    const headersToForward = [
      'content-type',
      'authorization',
      'accept',
      'accept-language',
      'x-requested-with',
    ];

    // Copy only necessary headers
    Object.keys(headers).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (headersToForward.includes(lowerKey)) {
        const value = headers[key];
        if (typeof value === 'string') {
          cleanHeaders[key] = value;
        } else if (Array.isArray(value) && value.length > 0) {
          const firstValue = value[0];
          if (typeof firstValue === 'string') {
            cleanHeaders[key] = firstValue;
          }
        }
      }
    });

    // Ensure Content-Type is set for POST/PUT/PATCH requests with body
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      if (!cleanHeaders['content-type'] && !cleanHeaders['Content-Type']) {
        cleanHeaders['Content-Type'] = 'application/json';
      }
    }

    console.log(`[GatewayService] Clean headers:`, cleanHeaders);

    const config: AxiosRequestConfig = {
      method: method.toLowerCase() as
        | 'get'
        | 'post'
        | 'put'
        | 'delete'
        | 'patch'
        | 'head'
        | 'options',
      url,
      headers: cleanHeaders,
      params: query,
      data: body,
      validateStatus: () => true, // Don't throw on any status
      timeout: 30000, // 30 seconds timeout (increased for database operations)
    };

    try {
      console.log(`[GatewayService] Sending request to ${url}...`);
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.request(config),
      );
      console.log(
        `[GatewayService] Received response: ${response.status} ${response.statusText}`,
      );
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<
          string,
          string | string[] | undefined
        >,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`[GatewayService] Error proxying to ${url}:`, {
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response
          ? {
              status: axiosError.response.status,
              statusText: axiosError.response.statusText,
              data: axiosError.response.data,
            }
          : null,
      });

      if (axiosError.response) {
        throw new HttpException(
          (axiosError.response.data as string) || axiosError.message,
          axiosError.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Handle timeout or connection errors
      if (
        axiosError.code === 'ECONNREFUSED' ||
        axiosError.code === 'ETIMEDOUT'
      ) {
        throw new HttpException(
          `Service ${service} is unavailable at ${url}. Error: ${axiosError.message}`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        `Service ${service} is unavailable: ${axiosError.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
