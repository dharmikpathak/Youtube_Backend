import mongoose,{Schema} from "mongoose"
import mongooseAggregatePagine from "mongoose-aggregate-paginate-v2"

const videoSchema= new Schema( {
    videoFile:{
        type:String,
        required:true
        
    },
    Thumbnail:{
        type:String,
        required:true
    },
    Title:{
        type:String,
        required:true
    },
    Description:{
        type:String,
        required:true
    },
    Views:{
        type:Number,
        default: 0 
    },
    Duration:{
        type:Number,
        required:true
    },
    isPublished:{
        type: Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }


},
{timestamps:true}
)

videoSchema.plugin(mongooseAggregatePagine)

export const Video = mongoose.model("Video",videoSchema)


