import express from "express";
import sql from '../config/db.js';
import dotenv from "dotenv";


const router = express.Router();

dotenv.config();

// API call to get NBA games
router.get('/games', async (req, res) => {

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
      limit: '1'
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
      homeTeam: event.teams.home.names.long,
      awayTeam: event.teams.away.names.long
      // moneyline: event.odds?.DraftKings?.moneyline,
      // spread: event.odds?.DraftKings?.spread
    }));
    
    // Returns the cleanedData
    return res.status(200).json(cleanedData);
  } catch (error) {
    return res.status(500).json({ error: "Event Fetching Error", details: error });
  }
});

export default router;