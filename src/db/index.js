import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";








const connectDB = async () =>{

    try{

        const connectionInstance = await mongoose.connect(`${process.env.MONGOBD_URI}/${DB_NAME}`)
        console.log(`/n MongDB connected !! DB Host:${connectionInstance.connection.host}`);

    }catch(error){
        console.log("MONGOOSE connection failed", error)
        process.exit(1)
    }
}

export default connectDB