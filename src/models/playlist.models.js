import mongoose,{Schema} from "mongoose"

const playlistSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    videos:[
        {
            type:Schema.Types.ObjectId,
            red:"Video",
        },

    ],
    Owner:{
        type: Schema.Types.ObjectId,
        red:"Video",
    },
},
)

export const Playlist = mongoose.model("Playlist",playlistSchema)
 