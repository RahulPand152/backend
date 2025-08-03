import { v2 as cloudinary } from "cloudinary";

import fs from "fs";



cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async(localFilePath) => {

    if(!
        fs.existsSync(localFilePath)){
            console.log('files des not exits:',localFilePath );
            return null
        }
    
    try {
        if(!localFilePath) return null
        //upload the file on cloudnary
       const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        
        //File has been uploadeed successfull
       // console.log("File is uploaded on cloudanary", response.url);
           

        return response;
        
    } catch (error) {

        fs.unlinkSync(localFilePath)
        console.log("Doesnot saved properly");//remove the locally saved temporary file as the upload operation got failed 
        return null;
        
        
    }
}
    
/*
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const uploadOnCloudinary = async (localFilePath) => {
    if (!fs.existsSync(localFilePath)) {
      console.error('File does not exist:', localFilePath);
      return null;
    }
  
    try {
      // Upload the file to Cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: 'auto',
      });
      console.log('File uploaded to Cloudinary:', response.url);
  
      // Remove the local file
      fs.unlinkSync(localFilePath);
      return response;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error.message);
      return null;
    }
  };
  */

export {uploadOnCloudinary}