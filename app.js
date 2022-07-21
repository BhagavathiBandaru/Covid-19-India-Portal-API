 express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "covid19IndiaPortal.db");
let database = null;
const initializeAndDbAndServer = async () => {
try {
database = await open({ filename: databasePath, driver: sqlite3.Database });
app.listen(3000, () => {
console.log(`server is running on http://localhost:3000`);
});
} catch (error) {
console.log(`Database error is ${error}`);
process.exit(1);
}
};
initializeAndDbAndServer();

function authenticationToken(request, response, next) {
let jwtToken;
const authHeader = request.headers["authorization"];
if (authHeader !== undefined) {
jwtToken = authHeader.split(" ")[1];
}
if (jwtToken !== undefined) {
jwt.verify(jwtToken, "its_password", async (error, payload) => {
if (error) {
response.status(401);
response.send(`Invalid JWT Token`);
next();
}
});
} else {
response.status(401);
response.send(`Invalid JWT Token`);
}
}

app.post("/login/", async (request, response) => {
const { username, password } = request.body;

const userDetailsQuery = `select * from user where username = '${username}';`;
const userDetails = await database.get(userDetailsQuery);
if (userDetails !== undefined) {
const isPasswordValid = await bcrypt.compare(
password,
userDetails.password
);
if (isPasswordValid) {
const payload = { username: username };
const jwtToken = jwt.sign(payload, "its_password");
response.send({ jwtToken });
} else {
response.status(400);
response.send(`Invalid password`);
}
} else {
response.status(400);
response.send("Invalid user");
}
});

const convertStateDbObjectToResponseObject = (dbObject) => {
return {
stateId: dbObject.state_id,
stateName: dbObject.state_name,
population: dbObject.population,
};
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
return {
districtId: dbObject.district_id,
districtName: dbObject.district_name,
stateId: dbObject.state_id,
cases: dbObject.cases,
cured: dbObject.cured,
active: dbObject.active,
deaths: dbObject.deaths,
};
};

app.get("/states/", authenticationToken, async (request, response) => {
const getStatesQuery = `
SELECT
*
FROM
state;`;
const statesArray = await db.all(getStatesQuery);
response.send(
statesArray.map((eachState) =>
convertStateDbObjectToResponseObject(eachState)
)
);
});

app.get("/states/:stateId/", authenticationToken, async (request, response) => {
const getStateQuery = `SELECT * from state
WHERE
state_id='${stateId}';`;
const stateDb = await db.get(getAllStatesQuery);
response.send(convertStateDbObjectToResponseObject(stateDb));
});

app.post("/districts/", authenticationToken, async (request, response) => {
const { stateId, districtName, cases, cured, active, deaths } = request.body;

const postNewDistrict = `INSERT INTO district(state_id,district_name,cases,cured,active,deaths)
VALUES(
${stateId},
'${districtName}',
${cases},
${cured},
${active},
${deaths},
);`;
await db.run(postNewDistrict);
response.send("District Created Successfully");
});

app.get(
"/districts/:districtId/",
authenticationToken,
async (request, response) => {
const { districtId } = request.params;
const getDistrictQuery = `SELECT * FROM district
WHERE
district_id='${districtId}';`;
const districtDb = await db.get(getDistrictQuery);
response.send(convertDistrictDbObjectToResponseObject(districtDb));
}
);

app.delete(
"/districts/:districtId/",
authenticationToken,
async (request, response) => {
const { districtId } = request.params;
const delDistrictQuery = `DELETE
from district
WHERE
districtId='${district_id}';`;
const districtDb = await db.run(delDistrictQuery);
response.send("District Removed");
}
);

app.put(
"/districts/:districtId/",
authenticationToken,
async (request, response) => {
const { districtId } = request.params;
const {
districtName,
stateId,
cases,
cured,
active,
deaths,
} = request.body;
const updateDistrict = `UPDATE
district
SET
district_name = '${districtName}',
state_id = ${stateId},
cases = ${cases},
cured = ${cured},
active = ${active},
deaths = ${deaths}
WHERE
district_id = ${districtId};
`;
await db.run(updateDistrict);
response.send("District Details Updated");
}
);

app.get(
"/states/:stateId/stats/",
authenticationToken,
async (request, response) => {
const { stateId } = request.params;
const getStateStatsQuery = `
SELECT
SUM(cases),
SUM(cured),
SUM(active),
SUM(deaths)
FROM
district
WHERE
state_id=${stateId};`;
const stats = await db.get(getStateStatsQuery);
response.send({
totalCases: stats["SUM(cases)"],
totalCured: stats["SUM(cured)"],
totalActive: stats["SUM(active)"],
totalDeaths: stats["SUM(deaths)"],
});
}
);

module.exports = app;
