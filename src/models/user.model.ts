type stringOrNull = string | null;

export interface UserModel {
    email: stringOrNull;
    pwd: stringOrNull;
    confirmPwd: stringOrNull;
}