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
        let type = "http";
        if (parts.length == 5) {
          type = "socks5";
        }

        if (username === null && password === null) {
          return {
            proxy: ip,
            port: port,
            username: "",
            password: "",
            type: type,
          };
        } else {
          // Remove \r from password if present
          const sanitizedPassword = password ? password.replace("\r", "") : "";
          return {
            proxy: ip,
            port: port,
            username: username || "",
            password: sanitizedPassword,
            type: type,
          };
        }
      });

    return proxies;
  } catch (error) {
    console.error("Error in getProxiesPlaywright:", error);
    return [];
  }
}

async function setProxyOnPage(page, proxy) {
  // Xác định loại proxy
  let proxyUrl;
  if (proxy.type === "socks5") {
    proxyUrl = `socks5://${encodeURIComponent(
      proxy.username
    )}:${encodeURIComponent(proxy.password)}@${proxy.proxy}:${
      proxy.port
    }`;
  } else if (proxy.type === "http") {
    proxyUrl = `http://${encodeURIComponent(
      proxy.username
    )}:${encodeURIComponent(proxy.password)}@${proxy.proxy}:${
      proxy.port
    }`;
  } else {
    throw new Error("Proxy type not supported");
  }

  console.log("proxyUrl", proxyUrl);
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


// async function proxyRoating(page, proxies) {
//   const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
//   console.log("proxy roating", randomProxy);

//   // Xác định loại proxy
//   let proxyUrl;
//   if (randomProxy.type === "socks5") {
//     proxyUrl = `socks5://${encodeURIComponent(
//       randomProxy.username
//     )}:${encodeURIComponent(randomProxy.password)}@${randomProxy.proxy}:${
//       randomProxy.port
//     }`;
//   } else if (randomProxy.type === "http") {
//     proxyUrl = `http://${encodeURIComponent(
//       randomProxy.username
//     )}:${encodeURIComponent(randomProxy.password)}@${randomProxy.proxy}:${
//       randomProxy.port
//     }`;
//   } else {
//     throw new Error("Proxy type not supported");
//   }

//   console.log("proxyUrl", proxyUrl);
//   // Reset request interception
//   await page.setRequestInterception(false);
//   await page.setRequestInterception(true);

//   // Remove all previous listeners
//   page.removeAllListeners("request");

//   // Add new proxy
//   page.on("request", async (request) => {
//     try {
//       await useProxy(request, proxyUrl.toString());
//     } catch (err) {
//       console.log(err);
//       request.continue();
//     }
//   });
//   return page;
// }

module.exports = {
  getProxies,
  setProxyOnPage,
  // proxyRoating,
};
