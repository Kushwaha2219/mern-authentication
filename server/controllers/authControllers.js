import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModels.js';
import transporter from '../config/nodemailer.js';
//registration controller
export const registration= async (req,res) =>{
    const { name, email, password} = req.body;

    if(!name || !email || !password ){
        return res.json({success: false, message: 'Missing Details'})
    }

    try {
        const existingUser = await userModel.findOne({email});

        if(existingUser){
            return res.json({success:false, message: 'User Already exits'})
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const user = new userModel({name, email, password : hashedPassword})
        await user.save();

        const token = jwt.sign(
            {id: user._id},
            process.env.SECRET_JWT,
            {expiresIn: '1d'}
        )

        res.cookie('token',token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            samesite : process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 1 * 24 * 60 * 1000
        })

        const mailOptions = {
            from : process.env.SENDER_EMAIL,
            to : email,
            subject: 'Account Creation',
            text: `Hello ${user.name}, your account has been successfully created.`,
  html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Account Created</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background-color: #f4f4f7;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 500px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      .heading {
        color: #333333;
        font-size: 22px;
        text-align: center;
        margin-bottom: 20px;
      }
      .welcome-box {
        background-color: #e6ffed;
        padding: 15px;
        font-size: 20px;
        color: #2e7d32;
        text-align: center;
        border-radius: 8px;
        margin: 20px 0;
      }
      .info {
        font-size: 16px;
        color: #555555;
        text-align: center;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 14px;
        color: #999999;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="heading">🎉 Welcome, ${user.name}!</div>
      <p class="info">Your account has been successfully created on our platform.</p>
      <div class="welcome-box">
        We’re excited to have you on board!
      </div>
      <p class="info">You can now log in and start exploring.</p>
      <div class="footer">
        If you have any questions, just reply to this email — we’re always happy to help.
      </div>
    </div>
  </body>
  </html>
  `
        }

        try {
            await transporter.sendMail(mailOptions);
        console.log("✅ Email sent");
        } catch (err) {
        console.error("❌ Failed to send email:", err.message);
        }


        return res.json({success:true})

    } catch (error) {
       return res.json({success: false, message : error.message})
    }
}
// login controllers
export const login = async(req,res) =>{
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: 'email and password required'})
    }

    try {
        const user = await userModel.findOne({email})
        if(!user){
            res.json({success:false, message:"Invalid User"})
        }

        const isMatched = await bcrypt.compare(password, user.password)

        if(!isMatched){
            res.json({success:false, message: 'Invalid Password'})
        }
        const token = jwt.sign(
            { id: user._id},
            process.env.SECRET_JWT,
            {expiresIn: '1d'}
        )

        res.cookie('token',token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 1 * 24 * 60 * 60 * 1000
        })

        return res.json({success:true})


    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

export const logout = async(req,res) =>{
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

        })

        return res.json({success:true, message: "User LoggedOut"})
    } catch (error) {
        return res.json({success: false, message : error.message})
    }
}

//Otp generation
export const sendVerifyOtp = async(req,res) =>{
    
    try {
        
        const userId = req.user.userId;


    const user = await userModel.findById(userId);
    if(!user){
        return res.json({success: false, message: 'User is not found'})
    }

    if (user.isVerified) {
        return res.json({ success: false, message: "User already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    
    user.verifyOtp = otp;
    const otpExpires = Date.now() + 5 * 60 * 1000

    const otpExp = Math.ceil((otpExpires - Date.now()) / (60 * 1000));

    user.verifyOtpExpiredAt = otpExpires
    await user.save();

    const mailOptions = {
        from : process.env.SENDER_EMAIL,
        to : user.email,
        subject: 'Otp Verification',
        text : `Verify Your Account using otp: ${otp}, Otp will expire in ${otpExp} minutes`,
        html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Your OTP Code</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        background-color: #f4f4f7;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 500px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      .heading {
        color: #333333;
        font-size: 22px;
        text-align: center;
        margin-bottom: 20px;
      }
      .otp-box {
        background-color: #f0f8ff;
        padding: 15px;
        font-size: 28px;
        letter-spacing: 5px;
        font-weight: bold;
        color: #0052cc;
        text-align: center;
        border-radius: 8px;
        margin: 20px 0;
      }
      .info {
        font-size: 16px;
        color: #555555;
        text-align: center;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 14px;
        color: #999999;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="heading">🔐 Email Verification</div>
      <p class="info">Use the OTP below to verify your email address:</p>
      <div class="otp-box">${otp}</div>
      <p class="info">This OTP will expire in <strong>${otpExp} minutes</strong>.</p>
      <div class="footer">
        If you didn’t request this, you can ignore this email.
      </div>
    </div>
  </body>
  </html>
  `
    }

    await transporter.sendMail(mailOptions);

    return res.json({success:true, message: 'Otp sent successfully'})

    } catch (error) {
        return res.json({success: false, message : error.message})
    }
}

//otp verification

export const Verification = async(req,res)=>{
    
    const { userId } = req.user || {};
    const { otp } = req.body;

    if(!userId || !otp) {
        return res.json({success:false,message: 'Missing details'})
    }
    try {
        const user = await userModel.findById(userId);
        if(!user){
            return res.json({success:false, message: 'user not found'})
        }
        if(user.verifyOtp === '' || user.verifyOtp != otp){
            return res.json({success:false, message: 'invalid otp'})
        }
        if(user.verifyOtpExpiredAt < Date.now()){
            return res.json({success:false, message: 'otp expired'})
        }

        user.isVerified = true;
        user.verifyOtp = ''
        user.verifyOtpExpiredAt = 0

        await user.save()

        return res.json({success: true, message:'email verified successfully'})
    } catch (error) {
        return res.json({success: false, message : error.message})
    }
}

export const sendResetPassword = async (req, res)=>{
    const {email} = req.body

    if(!email){
        return res.json({success:false, message:'Email is missing'})
    }

    try {
        const user = await userModel.findOne({email})

        if(!user) {
            return res.json({success:false, message: 'user not found'})
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

    
        user.resetOtp = otp;
        const otpExpires = Date.now() + 5 * 60 * 1000

        const otpExp = Math.ceil((otpExpires - Date.now()) / (60 * 1000));

        user.resetOtpExpiredAt = otpExpires
        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Reset Password OTP',
            text: `Hello ${user.name}, use the following OTP to reset your password: ${otp}. This OTP will expire in ${otpExp} minutes.`,
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reset Password OTP</title>
                <style>
                body {
                    font-family: 'Segoe UI', sans-serif;
                    background-color: #f4f4f7;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }
                .heading {
                    color: #333333;
                    font-size: 22px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .otp-box {
                    background-color: #fff3cd;
                    padding: 15px;
                    font-size: 28px;
                    letter-spacing: 5px;
                    font-weight: bold;
                    color: #856404;
                    text-align: center;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .info {
                    font-size: 16px;
                    color: #555555;
                    text-align: center;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #999999;
                }
                </style>
            </head>
            <body>
                <div class="container">
                <div class="heading">🔐 Password Reset Request</div>
                <p class="info">We received a request to reset your password. Use the OTP below to proceed:</p>
                <div class="otp-box">${otp}</div>
                <p class="info">This OTP will expire in <strong>${otpExp} minutes</strong>.</p>
                <div class="footer">
                    Didn’t request this? Ignore this email or contact support.
                </div>
                </div>
            </body>
            </html>
            `
            };

            await transporter.sendMail(mailOptions)
             return res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        return res.json({success: false, message : error.message})
    }

}

export const resetPassword = async(req,res) =>{

    const{email, otp, newPassword} = req.body;

    if(!email || !newPassword || !otp){
        return res.json({success: false, message: 'email and password required'})
    }
    try {
        const user = await userModel.findOne({email})

        if(!user){
            return res.json({success:false,message: 'Missing details'})
        }

        if(user.resetOtp === '' || user.resetOtp != otp){
            return res.json({success:false, message: 'invalid otp'})
        }
        if(user.resetOtpExpiredAt < Date.now()){
            return res.json({success:false, message: 'otp expired'})
        }

        const hashedPassword = await bcrypt.hash(newPassword,10);
        user.password = hashedPassword
        user.resetOtp = ''
        user.resetOtpExpiredAt = 0

        await user.save();
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Your Password Was Reset Successfully',
            text: `Hello ${user.name}, your password has been successfully reset. If this wasn't you, please contact support immediately.`,
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Password Reset Successful</title>
                <style>
                body {
                    font-family: 'Segoe UI', sans-serif;
                    background-color: #f4f4f7;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }
                .heading {
                    color: #333333;
                    font-size: 22px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .message-box {
                    background-color: #e0f7fa;
                    padding: 15px;
                    font-size: 18px;
                    color: #00796b;
                    text-align: center;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .info {
                    font-size: 16px;
                    color: #555555;
                    text-align: center;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #999999;
                }
                </style>
            </head>
            <body>
                <div class="container">
                <div class="heading">🔒 Password Changed</div>
                <p class="info">Hi ${user.name},</p>
                <div class="message-box">
                    Your password has been reset successfully.
                </div>
                <p class="info">If this wasn't you, please <strong>secure your account immediately</strong> and contact our support team.</p>
                <div class="footer">
                    Stay safe,<br>Your Support Team
                </div>
                </div>
            </body>
            </html>
            `
            };
            await transporter.sendMail(mailOptions)
        return res.json({success: true, message:'password reset successfully'})
    } catch (error) {
        return res.json({success: false, message : error.message})
    }
}