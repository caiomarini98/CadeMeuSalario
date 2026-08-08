import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

let userPool: CognitoUserPool | null = null;
try {
  if (USER_POOL_ID && CLIENT_ID) {
    userPool = new CognitoUserPool({ UserPoolId: USER_POOL_ID, ClientId: CLIENT_ID });
  }
} catch (e) {
  console.error('Failed to init Cognito:', e);
}

export type UserRole = 'admin' | 'user' | 'advisor';
export type UserPlan = 'free' | 'premium';

export interface AuthUser {
  email: string;
  name?: string;
  sub: string;
  role: UserRole;
}

export function getCurrentUser(): Promise<AuthUser | null> {
  return new Promise((resolve) => {
    if (!userPool) return resolve(null);
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null) => {
      if (err) return resolve(null);
      user.getUserAttributes((err2, attrs) => {
        if (err2 || !attrs) return resolve(null);
        const get = (name: string) => attrs.find((a) => a.getName() === name)?.getValue() ?? '';
        resolve({ email: get('email'), name: get('name') || undefined, sub: get('sub'), role: (get('custom:role') || 'user') as UserRole });
      });
    });
  });
}

export function getIdToken(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!userPool) return resolve(null);
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: { getIdToken: () => { getJwtToken: () => string } } | null) => {
      if (err || !session) return resolve(null);
      resolve(session.getIdToken().getJwtToken());
    });
  });
}

export function signUp(email: string, password: string, name?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Auth not configured'));
    const attrs: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];
    if (name) attrs.push(new CognitoUserAttribute({ Name: 'name', Value: name }));
    userPool.signUp(email, password, attrs, [], (err) => {
      if (err) return reject(new Error(err.message));
      resolve();
    });
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Auth not configured'));
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(new Error(err.message));
      resolve();
    });
  });
}

export function signIn(email: string, password: string): Promise<AuthUser> {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Auth not configured'));
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const payload = session.getIdToken().decodePayload();
        resolve({ email: payload.email, name: payload.name, sub: payload.sub, role: (payload['custom:role'] || 'user') as UserRole });
      },
      onFailure: (err) => reject(new Error(err.message)),
    });
  });
}

export function signOut(): void {
  if (!userPool) return;
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

export function resendConfirmationCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Auth not configured'));
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.resendConfirmationCode((err) => {
      if (err) return reject(new Error(err.message));
      resolve();
    });
  });
}

export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Auth not configured'));
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(new Error(err.message)),
    });
  });
}

export function confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('Auth not configured'));
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(new Error(err.message)),
    });
  });
}
