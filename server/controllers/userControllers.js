import userModel from "../models/userModels.js";

export const getUserDetails = async (req,res) =>{


    try {
         const { userId } = req.user || {};
        const user = await userModel.findById(userId)
        if(!user){
             return res.json({success:false,message: 'Missing details'})
        }
        
        res.json({success:true, 
            userData:{
                    name: user.name,
                    isVerified: user.isVerified
            } 
        })
    } catch (error) {
         return res.json({success: false, message : error.message})
    }
}