// Services package - Shared business logic and utilities
export const SERVICES_PACKAGE_VERSION = "1.0.0";

// Example service - you can add your business logic here
export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return response.json();
  }
}

export { ApiService as default };
