import { Response } from "express";


export interface AuthTokens {
    token?: string;
    refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
    if (tokenInfo.token) {
        res.cookie("token", tokenInfo.token, {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });
    };

    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });
    };
};