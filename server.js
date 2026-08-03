const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
const cors = require("cors");
const app = express();
app.use(cors()); // allow requests from all frontend.

require("dotenv").config();


// Create a connection pool to the database
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 3306,
  ssl: { ca: fs.readFileSync("./DigiCertGlobalRootG2.crt.pem") },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//========== ENDPOINTS ============//

// Root endpoint: returns all countries
app.get("/", (req, res) => {
  console.log("GET / endpoint was hit 🎯");
  pool.query("SELECT * FROM country", (err, results) => {
    if (err) {
      console.error("Error fetching countries:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

// Get a list of countries that belong to Oceania
app.get("/oceania", (req, res) => {
  console.log("GET /oceania endpoint was hit 🎯");
  const query = `
    SELECT Name, LifeExpectancy 
    FROM country 
    WHERE Continent = 'Oceania' 
    ORDER BY LifeExpectancy DESC 
    LIMIT 10;
  `;
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching Oceania countries:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

// Show information about a specific country by its name
app.get("/country/:countryname", (req, res) => {
  console.log(`GET /country/${req.params.countryname} endpoint was hit 🎯`);
  const { countryname } = req.params;

  const query = "SELECT * FROM country WHERE Name = ?";
  pool.execute(query, [countryname], (err, results) => {
    if (err) {
      console.error(`Error fetching details for ${countryname}:`, err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

// Find the total population of a continent
app.get("/population/:continent", (req, res) => {
  console.log(`GET /population/${req.params.continent} endpoint was hit 🎯`);
  const { continent } = req.params;

  const query =
    "SELECT SUM(Population) AS total_population FROM country WHERE Continent = ?";
  pool.execute(query, [continent], (err, results) => {
    if (err) {
      console.error(`Error fetching population for ${continent}:`, err);
      return res.status(500).send("Internal Server Error");
    }
    const totalPopulation = results[0]?.total_population || 0;
    res.send(`The total population of ${continent} is ${totalPopulation}`);
  });
});

//========== PORT ============//
/**
  App Service sets the environment variable PORT in the Node.js container, 
  and forwards the incoming requests to your container at that port number. 
  
  To receive the requests, your app should listen to that port using process.env.PORT. 
 */
const PORT = process.env.PORT || 4000;

app
  .listen(PORT, () => {
    console.log(`Server is live at http://localhost:${PORT}`);
  })
  .on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error("Port is already in use");
    } else {
      console.error("Server Error:", error);
    }
  });
