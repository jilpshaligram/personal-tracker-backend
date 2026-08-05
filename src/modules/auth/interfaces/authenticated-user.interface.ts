export interface IAuthenticatedUser {
  id: string;
  email: string;
  role: string;
  sessionId: string;
}
