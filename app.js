const puppeteer = require('puppeteer');
const fs = require('fs');


  // Launch the browser
  let browser;
  let productData;
  const main = async () => {
    try {
      browser = await puppeteer.launch();

      // Create a page
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(2 * 60 * 1000)

      // Go to your site
      await page.goto('https://www.evo.com/shop/snowboard/snowboards/rpp_2');
      
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
            url: url,
          };
        });
      });

    } catch (e) {
      console.error(err)
    }
    finally {
      // Close browser.
      await browser?.close();
      fs.writeFileSync('productData.json', JSON.stringify(productData, null, 2));
  }
}

main();