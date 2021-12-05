exports.trigger =  async function trigger() {
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