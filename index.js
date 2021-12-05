const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const cors = require("cors")
const { thgCrawler } = require("./routes/crawler/thg/controller.js")


const app = express();

const bathosUrl = "https://marketplace.thetanarena.com/?sort=PriceAsc&heroTypeIds=18&skinIds=&skinRarity=1&page=1"
const serpUrl = "https://marketplace.thetanarena.com/?sort=PriceAsc&skinRarity=2&heroTypeIds=1&skinIds=&page=1"

cron.schedule("* */40 * * * *", async () => {
  await Promise.all([
    await thgCrawler(
      mainUrl=bathosUrl, 
      nftName="Bathos", 
      maxRange=4, 
      maxPrice=460, // Dolar
      minPrice=200  // Dolar
    ),
  ])
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
      credentials: true,
      origin: true
  })
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
