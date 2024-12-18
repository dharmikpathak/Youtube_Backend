import mongoose,{Schema} from "mongoose"
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken" // gives token to user that stores login information , {hooks method 16:00}


const userSchema= new Schema(
    {
        username:{
            type: String,
            required: true,
            uniqued: true,
            lowercase: true,
            trim: true,
            index:true
        },
        email:{
            type: String,
            required: true,
            uniqued: true,
            lowercase: true,
            trim: true,
        },
        fullname:{
            type: String,
            required: true,
            trim: true,
            index:true
        },
        avatar:{
            type: String,
            required: true

        },
        coverImage:{
            type: String

        },
        watchHistoyu:[
            {
                type: Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"]
        },
        refreshhToken:{
            type:String
        }

    },
    { timestamps: true}
)

userSchema.pre("save",async function (next) {

    if (this.isModified("Password")) return next()
    
    this.password = bcrypt.hash(this.password,10)

    next()

userSchema.methods.isPasswordCorrect = async function (password)  // password or Paddword not sure
{
    return await bcrypt.compare(password,this.password)    
}

userSchema.methods.generateAccessTokens = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname

    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.generaterefreshhTokens = function(){
    return jwt.sign({
        _id:this._id,
        

    },
    process.env.refreshH_TOKEN_SECRET,
    {expiresIn: process.env.refreshH_TOKEN_EXPIRY}
    )
}


})
export const user = mongoose.model("User",userSchema)