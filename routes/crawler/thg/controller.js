const puppeteer = require("puppeteer"); 
const { key } = require("./secrets.json")
const axios = require('axios').default;

exports.thgCrawler = async (mainUrl, nftName, maxRange = 5, maxPrice, minPrice) => {
  console.log("------- Executing Cronjob ---------")
  console.log("-------     "+nftName+"          ---------")


  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true
  });

  try {
    await _trigger()

  } catch (error) {
    console.error({
      errorMessage: "Error during the trigger or the interval function flow execution",
      callback: error.message
    });
  }

  /* 
    Functions Section
  */ 
  async function _trigger() {
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
      console.error ({
        errorMessage: "Error accessing URL",
        callback: error.message
      });
    }
  }
                
  async function pageOnRequest(request){
    request.continue()
  }

  async function pageOnResponse(response) {
    const thetanRequestUrl = "/thetan/v1/nif/search?sort=PriceAsc&skinRarity=1&heroTypeIds=18&skinIds=&from=0&size=16"

    let objectToReturn = {
      timestamp: Date.now(),
      data: []
    }
  
    if (response.url().endsWith(thetanRequestUrl)) {
      try { 
        await _handleResponsePayload(response, objectToReturn)
        
      } catch (error) {
        console.error({
          errorMessage: "Erro on page response",
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
      console.error({
        errorMessage: "Error during request",
        callback: failure.errorText
      });
    }
  }

  async function _handleResponsePayload(response, objectToReturn) {
    try {
      const prePayload = await response.text()
      if(!prePayload) return response.ok()
      const object = JSON.parse(prePayload)
  
      for(i=2; i < maxRange + 2; i++) {
        const {id, name, price } = object.data[i]
        const priceInWBNB = price / 100000000
        const priceInDollar = priceInWBNB  * 5.65 * 100
  
        let payload = {
          id,
          name,
          priceInWBNB,
          priceInDollar
        }
        
        objectToReturn.data.push(payload)
        await checkItWorthSellAndSendMessage(priceInDollar, payload)
      }
    } catch (error) {
      console.error({
        errorMessage: "Erro handling page response",
        callback: error.message
      });

    }
    
    console.log(objectToReturn)
  }

  async function checkItWorthSellAndSendMessage(priceInDollar, object) {
    const messageUp = "ATENÇÃO: \n '"+object.name+"' está acima de "+maxPrice+"$ ("+maxPrice+")"
    const messageDown= "ATENÇÃO: \n '"+object.name+"' está abaixo de "+minPrice+"$ ("+maxPrice+")"
    const number = "61991169967"

    if(priceInDollar >= maxPrice)  {
      await sendSms(number, messageUp)
    } else if(priceInDollar <= minPrice) {
      await sendSms(number, messageDown)
    }
  }

  async function sendSms(number, message) {
    try {
      const postData = await generatePostDataSmsByNumber(number, message)

      const clientServerOptions = {
        method: 'post',
        url: `https://api.smsdev.com.br/v1/send`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: postData,
      }

      await axios.request(clientServerOptions)
      console.log("=> SMS enviado com sucesso")

      
    } catch (error) {
      console.error({
        errorMessage: "Error sending SMS",
        callback: error.message
      });
    }
  }

  async function generatePostDataSmsByNumber(number, message) {
    return {
      "key" : process.env.KEY || key,
      "type" : 9,
      "number" : number,
      "msg" : message
      }
  }
}
