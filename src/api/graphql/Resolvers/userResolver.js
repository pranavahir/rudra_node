const db = require('../../../../config/db')
const crypto = require('crypto');
const bcrypt = require('bcryptjs')
const { sendMail } = require('../../../../utlility/mail')
const jwt = require('jsonwebtoken')
require('dotenv').config();
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
}
module.exports = {
  loginUser: async (args) => {
    try {
      const fetchuser = await db.query(`select * from rudra_users where email = '${args.email}'
      `)
      if (!fetchuser.rows.length) {
        return {
          success: false,
          message: "User Not Found!"
        }
      }
      if (!fetchuser.rows[0].is_verified) {
        return {
          success: false,
          message: "User is not Verified!"
        }
      }
      const verifypassword = await bcrypt.compare(args.password, fetchuser.rows[0].password)
      if (!verifypassword) {
        return {
          success: false,
          message: "Invalid Password!"
        }
      }
      const token = await jwt.sign(
        { userobj: fetchuser.rows[0] },
        process.env.SECRET_KEY,
        { expiresIn: '24h' }
      )
      return {
        success: true,
        message: "User Login Successfully!",
        token: token
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        message: "Something Went Wrong!",
        userdata: null
      }
    }
  },
  registerUser: async (args) => {
    try {
      const fetchuser = await db.query(`select email,is_verified from rudra_users where email = '${args.email}'`)
      if (fetchuser.rows.length) {
        if (fetchuser.rows[0].is_verified === false) {
          const deletenonverifieduser = await await db.query(`
        delete from rudra_users where email = '${args.email}'
      `)
        }
        else {
          return {
            success: false,
            message: "Email Already Exists!"
          }
        }
      }
      const hashedPassword = await bcrypt.hash(args.password, 12);
      const verification_code = crypto.randomBytes(12).toString('hex').slice(0, 12);
      await db.query(`
        insert into rudra_users(username,password,email,createdat,updatedat,verification_code) values ('${args.username}','${hashedPassword}','${args.email}','${new Date().toISOString()}','${new Date().toISOString()}','${verification_code}')
      `)
      setTimeout(async () => {
        const deleteuser = await await db.query(`
        delete from rudra_users where email = '${args.email}' and is_verified = false
      `)
      }, 300000)
      let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .button {
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: #fff;
            background-color: #007bff;
            border: none;
            border-radius: 5px;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
            font-family: Arial, sans-serif;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to Rudra</h1>
          <p>Thank you for joining us. Click the button below to get verified:</p>
          <a href="${process.env.BASE_URL}/${verification_code}" class="button">Verify Email</a>
          <div class="footer">
            <p>© 2024 Rudra. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
      sendMail(args.email, `Welcome to Rudra - ${args.username}`, html);
      return {
        success: true,
        message: "Please Check Your Email & Verify!"
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        message: "Something Went Wrong!"
      }
    }
  },
  verifyUser: async (args) => {
    try {
      const fetchuser = await db.query(`select id,email,is_verified from rudra_users where verification_code = '${args.verifytoken}'`)
      if (!fetchuser.rows.length) {
        return "Token Expired!"
      }
      await db.query(`update rudra_users set is_verified = true,verification_code = NULL where verification_code = '${args.verifytoken}'`)
      return "Verification Successful!"
    } catch (error) {
      console.log(error)
      return "Something Went Wrong!"
    }
  },
  fetchUsers: async (args,req) => {
    try {
      if(!req.isAuth){
        return{
          message:"UnAuthorized!"
        }
      }
      const fetchuser = await db.query(`select * from rudra_users
      `)
      return {
        message:"Success",
        UserResponse:fetchuser.rows
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        message: "Something Went Wrong!",
        userdata: null
      }
    }
  },
  forgetPassword: async (args,req) => {
    try {
      const fetchuser = await db.query(`select * from rudra_users where email = '${args.email}'
      `)
      if (!fetchuser.rows.length) {
        return "User Not Found!"
      }
      if (!fetchuser.rows[0].is_verified) {
        return "User is not Verified!"
      }
      const generateotp = generateOTP()
      const updateotp = await db.query(`update rudra_users set otp = '${generateotp}' where email = '${args.email}'`)
      setTimeout(async() => {
        const resetotp = await db.query(`update rudra_users set otp = NULL where email = '${args.email}'`)
      },300000)
      sendMail(args.email, `OTP For Password Reset - ${fetchuser.rows[0].username}`, `<div> Your OTP for Password Reset is ${generateotp}</div>`);
      return "OTP Generated Successfully!"
    } catch (error) {
      console.log(error)
      return "Something Went Wrong!"
    }
  },
  resetPassword: async (args,req) => {
    try {
      const fetchuser = await db.query(`select * from rudra_users where email = '${args.email}' and otp = '${args.otp}' 
      `)
      if (!fetchuser.rows.length) {
        return "Invalid OTP!"
      }
      if (!fetchuser.rows[0].is_verified) {
        return "User is not Verified!"
      }
      const hashedPassword = await bcrypt.hash(args.password, 12);
      const updateotp = await db.query(`update rudra_users set password = '${hashedPassword}',otp = NULL where email = '${args.email}'`)
      return "Password Reset Successfully!"
    } catch (error) {
      console.log(error)
      return "Something Went Wrong!"
    }
  }
}