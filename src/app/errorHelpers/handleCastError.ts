/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose from "mongoose";
import { IGenericResponse } from "../interfaces/error.types";

export const handleCastError = (err: mongoose.Error.CastError): IGenericResponse => {
    return {
        statusCode: 400,
        message: "Invalid MongoDB ObjectID. Please provide a valid ID."
    }
}