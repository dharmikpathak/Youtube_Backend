import mongoose from "mongoose";
import { APIerror } from "../utils/APIerroe.js";

const errorHandler = (err,req ,res,next) =>{
    let error = err
if(!(error instanceof APIerror))
    {
    const statusCode = error.statusCode || error instanceof mongoose.Error ? 200:400

    const message = error.message || "Something Went wrong"
    error= new APIerror(statusCode, message,error?.errors || [], err.stack)
    }

    const response = {
        ...error,
        message:error.message,
        ...(process.env.NODE_ENV==="development" ? {stack: error.stack}: {})
    }

    return res.status(error.statusCode).json(response)

}

export {errorHandler}