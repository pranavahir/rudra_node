//This is the Graphql Schema Files Where We Define Structure of Inputs(Parameter/Arguments/Variables) as well as Outputs.
/*
Graphql Schema Comments 

Single Line Comment 
-> # Comment1

Multiple Line Comment
"""
Comment1
Comment2
"""
*/

const { gql } = require("apollo-server-express");
module.exports = gql`
    type UserData{
        id:Int,
        email:String,
        username:String,
        is_verified:Boolean
    }
    type ListUser{
        message:String,
        UserResponse:[UserData]
    }
    type UserResponse{
        success:Boolean
        message:String
        token:String
    }
    type UserRegisterResponse{
        success:Boolean
        message:String
    }
    #Query -> For Fetching Data
    type Query{
        loginUser(email:String!,password:String!):UserResponse
        fetchUsers:ListUser
    }
    #Mutation -> For Storing or Updating Data
    type Mutation{
        registerUser(username:String!,password:String!,email:String!):UserRegisterResponse
        verifyUser(verifytoken:String!):String
        forgetPassword(email:String!):String
        resetPassword(email:String!,otp:String!,password:String!):String
    }

`