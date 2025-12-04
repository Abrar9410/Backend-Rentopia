export interface IErrorSources {
    path: string;
    message: string;
};

export interface IGenericResponse {
    statusCode: number;
    message: string;
    errorSources?: IErrorSources[];
};