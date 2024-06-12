// import mongoose from "mongoose"
// import { DB_NAME } from '../src/constants.js'
// import express from "express"
// const app = express();

// require('dotenv').config({path: './.env'});
import {app} from './app.js'
import dotenv from 'dotenv'
import connectDB from './db/index.js'

dotenv.config({
    path: './.env'
})

    
    app.on("error", (error)=> {
        console.log("ERROR: ", error);
        throw new Error(error)
    });
    connectDB()
    .then(()=>{
        app.listen(process.env.PORT || 8000, ()=> {
            console.log(`App is listening on Port: ${process.env.PORT}`);
        })
    })
    .catch((err)=>{
        console.log("MongoDB Error: ", err);
    })





// (async ()=> {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error)=> {
//             console.log("ERROR: ", error);
//             throw new Error(error)
//         });

//         app.listen(process.env.PORT, ()=>{
//             console.log(`App is listening on Port: ${process.env.PORT}`);
//         })
        
//     } catch (error) {
//         console.error("ERROR", error);
//     }
// })();