const axios = require('axios');

const launches = require('./launches.mongo');

const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {

    console.log('Downloading launch data...');
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1,
                    },
                },
                {
                    path: 'payloads',
                    select: {
                        customers: 1,
                    },
                },
            ],
        },
    });

    if(response.status !== 200){
        console.log('Proplem downloading launch data');
        throw new Error('Launch data download failed');
    }
    
    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const customers = launchDoc['payloads'].flatMap((payload) => {
            return payload['customers'];
        });
        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
        };

        await saveLaunches(launch);
    }
}

async function loadLaunchesData() {

    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    });
    if (firstLaunch) {
        console.log('Launch data already loaded!');
    } else {
        await populateLaunches();
    }
    
}

async function findLaunch(filter) {

    return await launches.findOne(filter);
}

async function existsLaunchWithId(launchId) {

    return await launches.findOne({
        flightNumber: launchId
    });
}

async function getLatestFlightNumber() {

    const latestLaunch = await launches.findOne({}).sort('-flightNumber');

    if(!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return Number(latestLaunch.flightNumber);
}

async function getAllLaunches(skip, limit) {

    return await launches
    .find({}, { '_id': 0, '__v': 0, })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function saveLaunches(launch) {

    await launches.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, {
        upsert: true,
    });
}

async function scheduleNewLaunch(launch) {

    const planet = await planets.findOne({
        kepler_name: launch.target,
    });

    if(!planet) {
        throw new Error('No matching planet found');
    }

    let newFlightNumber = await getLatestFlightNumber();

    newFlightNumber = newFlightNumber + 1;

    const newLaunch = Object.assign(launch, {
        flightNumber: newFlightNumber,
        customers: ['AL-Baath University', 'NASA'],
        upcoming: true,
        success: true,
    });

    await saveLaunches(newLaunch);
}

async function abortLaunchById(launchId) {
    
    await launches.findOneAndUpdate({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false,
    });

    const aborted = await launches.findOne({
        flightNumber: launchId,
    });

    if(aborted.upcoming === false && aborted.success === false) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    loadLaunchesData,
    existsLaunchWithId,
    scheduleNewLaunch,
    getAllLaunches,
    abortLaunchById,
    saveLaunches,
}