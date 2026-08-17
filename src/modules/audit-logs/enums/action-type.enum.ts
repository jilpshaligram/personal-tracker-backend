/**
 * Audit log action types
 *
 * Categorizes the type of operation performed in an audit log entry
 *
 * @enum ActionType
 */
export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  VIEW = 'VIEW',
  PAYMENT = 'PAYMENT',
  EXPORT = 'EXPORT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MARK_READ = 'MARK_READ',
  DOWNLOAD = 'DOWNLOAD',
  CONTRIBUTION = 'CONTRIBUTION',
}
