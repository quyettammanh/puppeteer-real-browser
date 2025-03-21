const fs = require("fs");
const { URL } = require("url");

const useProxy = require("@lem0-packages/puppeteer-page-proxy");

function getProxies(filePath) {
  try {
    // Ensure filePath is a string
    if (Array.isArray(filePath)) {
      throw new Error("filePath must be a string");
    }
    // Read the proxy file
    const proxyText = fs.readFileSync(filePath, "utf-8");

    // Split the proxy text into lines and process each line
    const proxies = proxyText
      .trim()
      .split("\n")
      .map((line) => {
        const parts = line.split(":");
        const ip = parts[0];
        const port = parts[1];
        const username = parts[2] || null;
        const password = parts[3] || null;

        if (username === null && password === null) {
          return {
            proxy: ip,
            port: port,
            username: "",
            password: "",
          };
        } else {
          // Remove \r from password if present
          const sanitizedPassword = password ? password.replace("\r", "") : "";
          return {
            proxy: ip,
            port: port,
            username: username || "",
            password: sanitizedPassword,
          };
        }
      });

    return proxies;
  } catch (error) {
    console.error("Error in getProxiesPlaywright:", error);
    return [];
  }
}

// const { URL } = require("url");
// const useProxy = require("@lem0-packages/puppeteer-page-proxy");

async function proxyRoating(page, url, proxies) {
  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
  console.log("proxy roating", randomProxy);

  // Construct a valid proxy URL
  const proxyUrl = new URL(`http://${randomProxy.proxy}:${randomProxy.port}`);
  proxyUrl.username = encodeURIComponent(randomProxy.username);
  proxyUrl.password = encodeURIComponent(randomProxy.password);

  console.log("proxyUrl", proxyUrl.toString());

  // Reset request interception
  await page.setRequestInterception(false);
  await page.setRequestInterception(true);

  // Remove all previous listeners
  page.removeAllListeners("request");

  // Add new proxy
  page.on("request", async (request) => {
    try {
      await useProxy(request, proxyUrl.toString());
    } catch (err) {
      console.log(err);
      request.continue();
    }
  });

  // await page.goto(url);
  return page;
}

module.exports = {
  getProxies,
  proxyRoating,
};
