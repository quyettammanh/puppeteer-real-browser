const axios = require("axios");
const LOCAL_URL = "http://127.0.0.1:19995";

class Gpmlogin {
  constructor(api_key) {
    this.api_key = api_key;
  }

  async getProfile(id) {
    const url = LOCAL_URL +'/api/v3/profiles/'+ `/${id}`;
    const res = await axios
      .get(url)
      .then((res) => res.data.data)
      .catch((err) => err.response.data);
    return res;
  }

  async getProfiles(offset = 0, limit = 1000) {
    const url = LOCAL_URL + '/api/v3/profiles?page=1&per_page=' + limit;
    const res = await axios
      .get(`${url}`)
      .then((res) => ({
        profiles: res.data.data,
      }))
      .catch((err) => err.response.data);
    return res;
  }

  async runProfile(id) {
    const url=LOCAL_URL + '/api/v3/profiles/start/'+`${id}`
    const res = await axios
      .get(url)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.log("Error response data:", err.response.data);
        return err.response.data;
      });
      if (res.data) {
        let wsEndpointValue = null;
        let retries = 0;
        const maxRetries = 5;

        while (!wsEndpointValue && retries < maxRetries) {
          try {
            await randomTime(1, 2);
            const remote_debugging_address = res.data.remote_debugging_address;
            const url_2 = 'http://' + remote_debugging_address + '/json/version';
            
            wsEndpointValue = await axios
              .get(url_2)
              .then((res) => {
                return res.data.webSocketDebuggerUrl;
              })
              .catch((err) => {
                console.log("Error response data:", err.message);
                return null;
              });

            retries++;
            if (!wsEndpointValue) {
              console.log(`Retry ${retries}/${maxRetries}: Endpoint not ready yet`);
            }
          } catch (err) {
            console.log("Error getting endpoint:", err.message);
            retries++;
          }
        }

        if (!wsEndpointValue) {
          return { success: false, message: "Could not get websocket endpoint after retries" };
        }

        return { success: true, wsEndpoint: wsEndpointValue };
      } else {
        console.log("Failure response data:", res);
        return {
          success: false,
          message: "Profile is running in another device",
        };
      }
  }

  async stopProfile(id) {
    const url = LOCAL_URL + `/${id}/stop`;
    const res = await axios
      .put(url)
      .then((res) => res.data)
      .catch((err) => err.response.data);
    return res;
  }

  async getProfilesRunning() {
    const url = LOCAL_URL + `/running`;
    const res = await axios
      .get(url)
      .then((res) => res.data)
      .catch((err) => err.response.data);
    return res;
  }
}

// function to generate random delay
async function randomTime(min = 1, max = 5) {
  // Generate a random delay between 1 and 2 seconds
  const delayInSeconds = Math.random() * (max - min) + min; // Random float between 1 and 5
  const delayInMilliseconds = delayInSeconds * 1000; // Convert to milliseconds
  // Pause execution for the specified delay
  await new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
}

module.exports = Gpmlogin;
