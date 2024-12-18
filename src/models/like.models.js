import mongoose,{Schema} from "mongoose"

const likeSchema = new Schema ({
    //either a vide,comment or tweet will be assigned others will be null
    video: {
        type: Schema.Types.ObjectId,
        ref:"Video",
    },
    Comment:{
        type: Schema.Types.ObjectId,
        ref:"Video",
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref:"Tweet",
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref:"User",
    }    
},
 {timestamps:true}
)