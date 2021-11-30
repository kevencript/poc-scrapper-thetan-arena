const puppeteer = require("puppeteer");

exports.thgCrawler = async (req, res) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false
  });

  // await req.on("close", error => {
  //   stateVariables.canceled = true
  // });

  const mainUrl = req.body.mainUrl ? req.body.mainUrl : null
  const maxRange = req.body.maxRange ? req.body.maxRange : 15
  const timeFrequencyInMinutes = req.body.timeFrequency ? req.body.timeFrequency : 60
  const thetanRequestUrl = "/thetan/v1/nif/search?sort=PriceAsc&skinRarity=1&heroTypeIds=4&skinIds=&from=0&size=16"


  // State Variables
  let stateVariables = {
    timeFrequencyInMinutes,
    maxRange,
    canceled: false
  }

  console.log("!! Collection initialized. Infos:")
  console.log("=> Scrapping every '"+timeFrequencyInMinutes+"' minutes;")
  console.log("=> Maximum of '"+maxRange+"' itens per scrapp;")

  try {
    const interval = timeFrequencyInMinutes * 60 * 1000;

    await trigger()

    const loopInterval = setInterval(async () => {
      console.log("-----"+timeFrequencyInMinutes+" passed, triggering new scrapping")
      await Promise.all([
        await isCanceled(loopInterval),
        await trigger()
      ])
    }, interval);
   
  } catch (error) {
    res.status(500).json({
      errorMessage: "Error during the trigger or the interval function flow execution",
      callback: error.message
    });
  }

  /* 
    Functions Section
  */ 
  async function trigger() {
    try {
      const page = await browser.newPage();
   
      await page.setRequestInterception(true);

      page.on("request", request => pageOnRequest(request))
      page.on("requestfailed", request => pageOnFailedRequest(request))
      page.on("response", async response => pageOnResponse(response));

      await page.goto(mainUrl, {
        waitUntil: ["networkidle2", "load", "domcontentloaded"],
        timeout: 1000000
      });

      await page.close()

    } catch (error) {
      return res.status(500).json({
        errorMessage: "Error accessing URL",
        callback: error.message
      });
    }
  }

  async function pageOnRequest(request){
    request.continue()
  }

  async function pageOnResponse(response) {
    let objectToReturn = {
      timestamp: Date.now(),
      data: []
    }
  
    if (response.url().endsWith(thetanRequestUrl)) {
      try { 
        const prePayload = await response.text()
        if(!prePayload) return response.ok()
        const object = JSON.parse(prePayload)

        for(i=0; i < stateVariables.maxRange; i++) {
          const {id, name, price } = object.data[i]

          let payload = {
            id,
            name,
            price: price / 100000000
          }
          
          objectToReturn.data.push(payload)
        }
        
        console.log(objectToReturn)
      } catch (error) {
        res.status(500).json({
          errorMessage: "Erro accessing URL",
          callback: error.message
        });
      }

    } else {
      response.ok()
    }
  }
  
  async function pageOnFailedRequest(request) {
    const url = request.url();
  
    if (url === thetanRequestUrl) {
      let failure = request.failure();
      return res.status(500).json({
        errorMessage: "Error during request",
        callback: failure.errorText
      });
    }
  }

  async function isCanceled(interval) {
    if(stateVariables.canceled){
      console.log("!! OPERATION CANCELED")
      clearInterval(interval)
      throw new Error('Operation canceled')
    }
  }
}
