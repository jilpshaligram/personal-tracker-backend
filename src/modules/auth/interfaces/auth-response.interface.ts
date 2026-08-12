export interface IAuthResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
