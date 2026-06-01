export type UserRole = "student" | "coord";

export type AuthSession = {
  role: UserRole;
  displayName: string;
  studentId?: string;
  matricula?: string;
};

export type LoginRequest =
  | { role: "student"; matricula: string }
  | { role: "coord"; password: string };

export const AUTH_COOKIE_NAME = "school-connect-session";
