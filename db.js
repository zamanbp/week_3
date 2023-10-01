
const MongoClient = require('mongodb').MongoClient;

let dbConnection
let collection
const uri = 'mongodb+srv://user_admin:adminIsHere@cluster0.5oyu1oi.mongodb.net/?retryWrites=true&w=majority';


module.exports = {
    connectToDb: (cb) => {
        return MongoClient.connect(uri)
            .then((client) => {
                // Get the database instance
                dbConnection = client.db('Week3');
                collection = dbConnection.collection('users')
                return cb();
            })
            .catch((error) => {
                console.error('Error connecting to MongoDB:', error);
            });
    },

    getDb: () => { return dbConnection },
    
}