import mongoose from "mongoose";

const startDB = async () =>{
    mongoose.connection.on('connected',() =>
        console.log("Database Connected")
    );
    await mongoose.connect(`${process.env.MONGODB_URL}/AUTH`)
}

export default startDB;