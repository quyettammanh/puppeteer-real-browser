const axios = require("axios");
const LOCAL_URL = "http://localhost:1010/api/profiles";

class Genlogin {
  constructor(api_key) {
    this.api_key = api_key;
  }

  async getProfile(id) {
    const url = LOCAL_URL + `/${id}`;
    const res = await axios
      .get(url)
      .then((res) => res.data.data)
      .catch((err) => err.response.data);
    return res;
  }

  async getProfiles(offset = 0, limit = 1000) {
    const url = LOCAL_URL;
    const res = await axios
      .get(`${url}`)
      .then((res) => ({
        profiles: res.data.data,
      }))
      .catch((err) => err.response.data);
    return res;
  }

  async runProfile(id) {
    const url ='http://localhost:1010/api/profiles/start/' + id + '?addination_args=--lang%3Dvi&win_pos=100%2C200&win_size=1280%2C720&win_scale=1'
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
        // console.log("Success response data:", res);
        const remote_debugging_address = res.data.remote_debugging_address;
        console.log("remote_debugging_address:", remote_debugging_address);
        const url_2='http://'+remote_debugging_address+'/json/version'
        const wsEndpointValue = await axios
          .get(url_2)
          .then((res) => {
            return res.data.webSocketDebuggerUrl;
          })
          .catch((err) => {
            console.log("Error response data:", err);
          });
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

module.exports = Genlogin;
