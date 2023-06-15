const puppeteer = require('puppeteer');
const fs = require('fs');

// Top K results from featured products page
const TOPK_PROD = 30;
const SKI_URL = "/shop/ski/skis";
const SNB_URL = "/shop/snowboard/snowboards";
const SCRAPE_URL = 'https://www.evo.com' + SNB_URL + "/rpp_" + TOPK_PROD;

const main = async () => {
  await scrape();
};

async function scrape() {
  let browser;
  let productData;

  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(2 * 60 * 1000);

    console.log("/!\\ Starting scrape /!\\");

    // Modify constant to search snb/ski and number of products scraped
    await page.goto(SCRAPE_URL);

    productData = await page.evaluate(() => {
      const products = Array.from(document.querySelectorAll('.product-thumb'));
      return products.map(product => {
        const name = product.querySelector('.product-thumb-title').innerText;
        const priceElement = product.querySelector('.product-thumb-price');
        const price = priceElement.querySelector('span')?.textContent || priceElement.textContent;
        const url = 'https://www.evo.com' + product.querySelector('a').getAttribute('href');
        return {
          productName: name.trim(),
          price: price.trim(),
          url: url
        };
      });
    });

    // Scrapes products subpages
    for (const product of productData) {
      console.log(`Starting ${product['productName']}...`);

      // Interval between subpage requests
      await new Promise(resolve => setTimeout(resolve, 2500));
      await page.goto(product['url']);

      // !!! Uncomment code to change schema for ski/snb !!!
      product.details = await page.evaluate(() => {

        //// =========FOR SKI=============
        // let data = {
        //   description: document.querySelector(".pdp-details-content p")?.textContent?.trim() ?? "",
        //   terrain: document.querySelector(".spec-terrain .pdp-spec-list-description")?.textContent?.trim() ?? "",
        //   abilityLevel: document.querySelector(".spec-ability-level .pdp-spec-list-description")?.textContent?.trim() ?? "",
        //   rockerType: document.querySelector(".spec-rocker-type .pdp-spec-list-description")?.textContent?.trim() ?? "",
        //   turningRadius: document.querySelector(".spec-turning-radius .pdp-spec-list-description")?.textContent?.trim() ?? "",
        //   tailType: document.querySelector(".spec-tail-type .pdp-spec-list-description")?.textContent?.trim() ?? "",
        //   materials: document.querySelector(".spec-core-laminates .pdp-spec-list-description")?.textContent?.trim() ?? "",
        //   warranty: document.querySelector(".spec-warranty .pdp-spec-list-description")?.textContent?.trim() ?? ""
        //   // ,
        //   // sizes: sizes?.toString()?.trim() ?? ""
        // };

        // ======FOR SNOWBOARD=========
        let data = {
          description: document.querySelector(".pdp-details-content p")?.textContent?.trim() ?? "",
          terrain: document.querySelector(".spec-terrain .pdp-spec-list-description")?.textContent?.trim() ?? "",
          abilityLevel: document.querySelector(".spec-ability-level .pdp-spec-list-description")?.textContent?.trim() ?? "",
          rockerType: document.querySelector(".spec-rocker-type .pdp-spec-list-description")?.textContent?.trim() ?? "",
          shape: document.querySelector(".spec-shape .pdp-spec-list-description")?.textContent?.trim() ?? "",
          flexRating: document.querySelector(".spec-flex-rating .pdp-spec-list-description")?.textContent?.trim() ?? "",
          materials: document.querySelector(".spec-core-laminates .pdp-spec-list-description")?.textContent?.trim() ?? "",
          warranty: document.querySelector(".spec-warranty .pdp-spec-list-description")?.textContent?.trim() ?? ""
        }

        console.log("Completed")
        return data;
      });
    };
  } catch (error) {
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
    fs.writeFileSync('data/productData.json', JSON.stringify(productData, null, 2));
    console.log("/!\\ Done /!\\")
  }
}

main();
