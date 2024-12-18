import jwt from "jsonwebtoken"
import {user} from "../models/user.models.js"
import {APIerror} from "../utils/APIerroe.js"
import {asyncHandler} from "../utils/asyncHandler.js"


export const verifyJWT = asyncHandler(async(req, _,next) =>{ // "_ " is just replacement if res bcs we dont need res in this
 
  const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer" , "")

  if(!token){
    throw new APIerror(401,"Unauthorized")
  }
   
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECREAT)
    const user = await user.findById(decodedToken?._id).
    select("-password -refreshToken")

    if(!user){
        throw new APIerror(401,"Unauthorized")
    }
    
    req.user = user //111 how to write middleware 
    
    next() // transfer the control from one middleware to another middle or to the final route

  } catch (error) {
    throw new APIerror(401, error?.message || "Invalid access token")
  }

})
