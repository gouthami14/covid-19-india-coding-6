const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertMovieNamePascalCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    statusName: dbObject.state_name,
    population: dbObject.population,
  };
};

//list of states
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT
    *
    FROM
     state;`;
  const statesArray = await db.all(getAllStatesQuery);
  response.send(
    statesArray.map((stateObject) => convertMovieNamePascalCase(stateObject))
  );
});

//state based on stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getMovieQuery = `
    SELECT
    *
    FROM
     state
    WHERE
     state_id = ${stateId};`;
  const state = await db.get(getMovieQuery);
  response.send(convertMovieNamePascalCase(state));
});

//create a table
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
     district
    VALUES
    ('${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//return district based on districtId
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
    *
    FROM
     district
    WHERE
     district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertMovieNamePascalCase(district));
});

//Delete a district from table
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
     district
    WHERE
     district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Updates the details of a specific district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
     district
    SET
     district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     cured =${cured},
     active = ${active},
     deaths = ${deaths}
    WHERE
     district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictQuery = `
    SELECT
    SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM 
     district
    WHERE
     state_id = ${stateId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

//Returns an object containing the state name of a district based on the district ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
     state_name AS stateName
    FROM
     district
    INNER JOIN state ON district.state_id = state.state_id
    WHERE
     district_id = ${districtId};`;
  const stateName = await db.get(getDistrictQuery);
  response.send(stateName);
});

module.exports = app;
