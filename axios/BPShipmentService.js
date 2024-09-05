const axios = require("axios");
const https = require("https");

// Create an instance of the HTTPS agent
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Disables SSL certificate verification
});

// Function to make POST request with custom HTTPS agent
const apiPost = async (url, payload) => {
  try {
    const response = await axios.post(url, payload, { httpsAgent });
    return response.data;
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
};

// Define and export the fetchBPShipmentService function
const fetchBPShipmentService = async (payload) => {
  console.log("payload:", payload);
  try {
    let BPShipmentData = await apiPost(
      `https://cl.gcptest.adidas.com/backend/clearance-engine/shipment/workflow`,
      payload
    );
    console.log("BPShipmentData:", BPShipmentData); // Add this line
    return BPShipmentData;
  } catch (error) {
    console.error("Error in fetchBPShipmentService:", error); // Add this line
    return { apifailStatus: true, error: error.message };
  }
};

module.exports = { fetchBPShipmentService };
