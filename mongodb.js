const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const options = {};

async function connectToDatabase() {
    const client = new MongoClient(uri, options);
    await client.connect();
    return client;
}


async function getKnownEvents() {
    const client = await connectToDatabase();
    const db = client.db('Points-Tracker');
    const collection = db.collection('SunDevils-Sync');
    
    let events;

    try { events = await collection.find({}, { projection: {eventID: 1 }}).toArray();
        console.log('Found events: ', events);
        events = events.map(event => event.eventID);
        }
    catch (error) { throw new Error('unable to read from db: ' + error.message); }
    finally { await client.close(); }
    
    return events
}



async function shipEvent(eventID, eventName, numAttendees) {
    if (typeof eventID !== 'string') {
      throw new Error('Event ID must be a string');
    }
  
    const client = await connectToDatabase();
    const db = client.db('Points-Tracker');
    const collection = db.collection('SunDevils-Sync');
  
    try { await collection.insertOne({ 
        eventID: eventID,
        name: eventName,
        attendees: numAttendees,
        value: 20 }); }
    catch (error) { throw new Error('unable to write to db: ' + error.message) }
    finally {await client.close(); }

    return
}



async function addAttendance(eventID, firstName, lastName, email) {

    console.log('[ ', eventID, ' ', firstName, ' ', lastName, ' ', email, ' ] >> Exporting to db...');

    const client = await connectToDatabase();
    const db = client.db('Points-Tracker');
    const collection = db.collection('Users');

    try {
        const userExists = await collection.findOne({ email });

        if (userExists) {
            await collection.updateOne(
                { email },
                { $addToSet: { attendedEvents: eventID }}
            );
        } else {
            await collection.insertOne({
                email,
                gituser: "",
                attendedEvents: [eventID],
                firstName,
                lastName,
        }); }
        } catch (error) {
        throw new Error('unable to update/insert user: ' + error.message);
    } finally { client.close(); }


}



module.exports = {
    getKnownEvents,
    shipEvent,
    addAttendance,
};