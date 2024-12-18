import connectDB  from "./db/index.js"
import {app} from   "./app.js"
import dotenv from "dotenv"

dotenv.config({
    path: "./.env"    
})

const port = process.env.port || 7000

connectDB()
.then(() => {
    app.listen(port,()=>{
        console.log(`server is running on port  ${port}`);
        
    })     
})      
.catch((err)=>{
    console.log("MongoDB connection error ", err);
    

})        
    
       