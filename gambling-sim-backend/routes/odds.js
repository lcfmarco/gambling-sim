import express from "express";
import sql from '../config/db.js';
import dotenv from "dotenv";


const router = express.Router();

dotenv.config();

// Data caching
  // Initialise two variables: one to hold the clean data, and one to check when it was last fetched
let cachedCleanedData = null;
let lastFetchTime = 0;

// API call to get NBA games
router.get('/games', async (req, res) => {

  // If data has been previously cached, and it hasn't been fetched for 15 minutes
    // Return the cached data
  if (cachedCleanedData && Date.now() - lastFetchTime <= 15 * 60 * 1000) {
    console.log("Fetching data from cache")
    // Return cached data
    return res.status(200).json(cachedCleanedData)
  } else {
    try {
      // Base API endpoint for events
      const baseEventsURL = 'https://api.sportsgameodds.com/v2/events/';
  
      // Storing parameters
        // Keeping it within NBA
        // Starts after the current date (only want dates now and future)
        // Keeping bookmaker to one for consistency
      const params = new URLSearchParams({
        sportID: 'BASKETBALL',
        leagueID: 'NBA',
        startsAfter: new Date().toISOString(), // now
        bookmaker: 'draftkings',
        limit: '2'
      });
  
      // Combining the baseURL and the parameters to form the fullURL when I fetch the data using this endpoint
      const fullUrl = `${baseEventsURL}?${params.toString()}`;
  
      // API call
      const response = await fetch(fullUrl, {
        headers: {
          'X-Api-Key': process.env.SGO_KEY,
        }
      });
  
      // Converting API response into JSON
      const rawData = await response.json();
  
      // Grabbing the data from the json file
      const events = rawData.data;
  
      // Cleaning the data, and formatting it so it shows the eventID, startTime, and teams involved
      const cleanedData = events.map(event => ({
        eventID: event.eventID,
        startTime: event.startTime,
        seasonWeek: event.info.seasonWeek,
        date: event.status.startsAt,
        homeTeam: event.teams.home.names.long,
        awayTeam: event.teams.away.names.long,
        homeTeamMoneyline: event.odds["points-home-game-ml-home"]?.byBookmaker?.draftkings?.odds,
        awayTeamMoneyline: event.odds["points-away-game-ml-away"]?.byBookmaker?.draftkings?.odds,
        homeTeamSpread: event.odds["points-home-game-sp-home"]?.byBookmaker?.draftkings?.spread,
        homeTeamSpreadOdds: event.odds["points-home-game-sp-home"]?.byBookmaker?.draftkings?.odds,
        awayTeamSpread: event.odds["points-away-game-sp-away"]?.byBookmaker?.draftkings?.spread,
        awayTeamSpreadOdds: event.odds["points-away-game-sp-away"]?.byBookmaker?.draftkings?.odds
      }));

      // Update cached data with newly fetched data
      cachedCleanedData = cleanedData;
      // Update last fetch time to now
      lastFetchTime = Date.now();
      
      console.log("Fetching data from API")
      // Returns the cleanedData
      return res.status(200).json(cleanedData);
    } catch (error) {
      return res.status(500).json({ error: "Event Fetching Error", details: error });
    }


  }
});
  

export default router;