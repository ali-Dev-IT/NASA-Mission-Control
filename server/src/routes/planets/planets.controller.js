const { getAllPlanents } = require('../../models/planets.model');

async function httpGetAllPlanets(req, res) {
    return res.status(200).json(await getAllPlanents());
}

module.exports = {
    httpGetAllPlanets,
};