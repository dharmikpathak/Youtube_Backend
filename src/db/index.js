import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () =>{
    try {
        const connectionsInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`\n MongoDB connected  ! DB Host : ${connectionsInstance.connect.host}`);
        

    } catch (error) {
        console.log("mongoDB connection error",error);
        process.exit(1)//what will one do?
    }
}

export default connectDB