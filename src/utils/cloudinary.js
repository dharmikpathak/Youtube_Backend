import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
import {config} from "dotenv"
config();


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})


const uploadonCloudinary = async(LocalFilePath) =>{
    try {
        console.log(LocalFilePath);
        if(!LocalFilePath) return null
        
        const response = await cloudinary.uploader.upload(LocalFilePath,{
            resource_type:"auto"
        })
        // console.log("File uploaded succesfully file src : " + response.url);
        // once file is uploaded, we should  delete it from the server
        fs.unlinkSync(LocalFilePath)// not compulsory
        return response
        
    } catch (error) {
        fs.unlinkSync(LocalFilePath)
    }
}

const deleteFromCLoudinary = async (publicId) =>{
    try {
        const result = await cloudinary.uploader.destroy(publicId)

    } catch (error) {
        console.log("errore while deleting from cloudinary", error);
        return null
        
    }
}


export {uploadonCloudinary , deleteFromCLoudinary}