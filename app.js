const puppeteer = require('puppeteer');
const fs = require('fs');

const main = async () => {
  convertSkiJsonToCsv("data/skiData200.json", "data/skiData200.csv");
};

function convertSkiJsonToCsv(jsonFilePath, outputPath) {
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath));

  const csvHeader = 'productType,productName,price,url,description,spec\n';
  let csvContent = '';

  jsonData.forEach(item => {
    const {
      productName,
      price,
      url,
      details: {
        description,
        terrain,
        abilityLevel,
        rockerType,
        turningRadius,
        tailType,
        materials,
        warranty
      }
    } = item;

    const csvRow = `"Ski", "${productName}","${price}","${url}","${description}","Terrain: ${terrain} | Ability Level: ${abilityLevel} | Rocker Type: ${rockerType} | Turning Radius: ${turningRadius} | Tail Type: ${tailType} | Core/Laminates: ${materials} | Warranty: ${warranty}"\n`;
    csvContent += csvRow;
  });

  const csvData = csvHeader + csvContent;

  fs.writeFileSync(outputPath, csvData);
  console.log('CSV file generated successfully:', outputPath);
}

async function scrape() {
  let browser;
  let productData;

  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(2 * 60 * 1000);

    await page.goto('https://www.evo.com/shop/ski/skis/rpp_200');

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

    for (const product of productData) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      await page.goto(product['url']);
      product.details = await page.evaluate(() => {
        //const tableRows = Array.from(document.querySelectorAll('.table-responsive table tbody tr'));
        //const sizes = [];
        // for (const row of tableRows) {
        //   const sizeCell = row.querySelector('th');
        //   const sizeValue = sizeCell.textContent.trim();
        //   if (sizeValue.includes('Size (cm)')) {
          //     const cmCells = Array.from(row.querySelectorAll('td'));
          //     const cmValues = cmCells.map(cell => cell.textContent.trim());
          //     sizes.push(cmValues + "cm");
          //   }
          // }
        // FOR SKI
        let data = {
          description: document.querySelector(".pdp-details-content p")?.textContent?.trim() ?? "",
          terrain: document.querySelector(".spec-terrain .pdp-spec-list-description")?.textContent?.trim() ?? "",
          abilityLevel: document.querySelector(".spec-ability-level .pdp-spec-list-description")?.textContent?.trim() ?? "",
          rockerType: document.querySelector(".spec-rocker-type .pdp-spec-list-description")?.textContent?.trim() ?? "",
          turningRadius: document.querySelector(".spec-turning-radius .pdp-spec-list-description")?.textContent?.trim() ?? "",
          tailType: document.querySelector(".spec-tail-type .pdp-spec-list-description")?.textContent?.trim() ?? "",
          materials: document.querySelector(".spec-core-laminates .pdp-spec-list-description")?.textContent?.trim() ?? "",
          warranty: document.querySelector(".spec-warranty .pdp-spec-list-description")?.textContent?.trim() ?? ""
          // ,
          // sizes: sizes?.toString()?.trim() ?? ""
        };
        // FOR SNOWBOARD
        // let data = {
        //   description: document.querySelector(".pdp-details-content p").textContent.trim(),
        //   terrain: document.querySelector(".spec-terrain .pdp-spec-list-description").textContent.trim(),
        //   abilityLevel: document.querySelector(".spec-ability-level .pdp-spec-list-description").textContent.trim(),
        //   rockerType: document.querySelector(".spec-rocker-type .pdp-spec-list-description").textContent.trim(),
        //   shape: document.querySelector(".spec-shape .pdp-spec-list-description").textContent.trim(),
        //   flexRating: document.querySelector(".spec-flex-rating .pdp-spec-list-description").textContent.trim(),
        //   materials: document.querySelector(".spec-core-laminates .pdp-spec-list-description").textContent.trim(),
        //   warranty: document.querySelector(".spec-warranty .pdp-spec-list-description").textContent.trim()
        // }
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
  }

}

main();
