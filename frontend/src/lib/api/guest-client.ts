import axios, { AxiosInstance } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

// Public API client for guest routes (no auth required)
export const guestApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include tenant headers
guestApiClient.interceptors.request.use(
  (config) => {
    // Add subdomain information for tenant requests
    if (typeof window !== "undefined") {
      const host = window.location.host;
      const hostParts = host.split(".");

      // Try to get subdomain from localStorage first (for consistency)
      let subdomain = null;
      if (typeof window !== "undefined") {
        subdomain = localStorage.getItem("current_subdomain");
      }

      // If not in localStorage, detect from host
      if (!subdomain) {
        if (hostParts.length >= 3) {
          // For subdomain.domain.com or subdomain.localhost:3000
          subdomain = hostParts[0];
        } else if (hostParts.length === 2 && hostParts[1].includes(":")) {
          // For subdomain.localhost:3000
          subdomain = hostParts[0];
        }

        // Store in localStorage for future requests
        if (subdomain && typeof window !== "undefined") {
          localStorage.setItem("current_subdomain", subdomain);
        }
      }

      // Always set the tenant subdomain header if we detected one
      if (
        subdomain &&
        subdomain !== "www" &&
        subdomain !== "app" &&
        subdomain !== "localhost" &&
        subdomain !== "127.0.0.1"
      ) {
        config.headers["X-Tenant-Subdomain"] = subdomain;
        console.log("🌐 Guest API Client: Added tenant header", subdomain);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to get tenant-aware base URL
export const getTenantApiUrl = (subdomain?: string | null): string => {
  // Always use the same backend URL for all requests
  // The tenant handling is done via headers, not URL subdomains
  return API_BASE_URL;
};

// Create a tenant-specific client
export const createTenantGuestClient = (subdomain: string): AxiosInstance => {
  return axios.create({
    baseURL: getTenantApiUrl(subdomain),
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Subdomain": subdomain,
    },
  });
};

// Add a response interceptor for logging, but no auth redirects
guestApiClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log("Guest API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("Guest API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Don't redirect on auth errors for guest routes
    // Just return the error to be handled by the component
    return Promise.reject(error);
  }
);
