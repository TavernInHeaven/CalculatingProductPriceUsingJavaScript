const xlsxFileName = 'PriceComparisonTable.xlsx';
const xlsxSheetName = 'Total';
const outPutXlsxFileName = 'output.csv';
const outPutXlsxSheetName = 'Total';
const xlsx = require('xlsx');

const fullCompetitorsList = [
  'Comp1',
  'Comp2',
  'Comp3',
  'Comp4',
  'Comp5',
  'Comp6',
  'Comp7',
  'Comp8',
]; //All competitors name list
const sixCompetitorsList = [
  'Comp1',
  'Comp2',
  'Comp3',
  'Comp5',
  'Comp7',
  'Comp8',
]; //cable adapter competitors name list

const supplierList = [
  'Supp1',
  'Supp2',
  'Supp3',
  'Supp4',
  'Supp5',
  'Supp6',
  'Supp7',
  'Supp8',
  'Supp9',
]; // All supplier name list

const excludedCategory = ['CAB', 'ADA', 'INK', 'TON'];

function readXLSXFile() {
  //Read xlsx file based on given file name and sheet name
  let wb = xlsx.readFile(xlsxFileName, { cellDates: true });
  let ws = wb.Sheets[xlsxSheetName];
  return xlsx.utils.sheet_to_json(ws);
}

process.stdout.write(`Working on it...`);
let data = readXLSXFile();
process.stdout.write(`Excel file loaded...Calculating...`);

// export to file below:

let finalData = [];
data.forEach((p) => {
  let finalProduct = mainLogic(p);
  finalData.push(finalProduct);
});

if (typeof require !== 'undefined') XLSX = require('xlsx');
var ws = XLSX.utils.json_to_sheet(finalData);
var wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, outPutXlsxSheetName);
XLSX.writeFile(wb, outPutXlsxFileName);
console.log(`\nCalculation completed. See ${outPutXlsxFileName} for result.`);

//Analyse result and test cases below:
/*
const productCase = 26570; //row number for a test product in the excel file

console.log(data[productCase - 2]);
console.log(data[productCase - 2].stock_ln === 'in stock');
console.log(getPriceListFrom8Competitors(data[productCase - 2]));
console.log(getSortedPriceListFrom8Competitors(data[productCase - 2]));
console.log(getPriceWithMoreThanTwoCompetitor(data[productCase - 2]));
*/
function mainLogic(p) {
  const category = getCategory(p);
  if (excludedCategory.includes(category)) {
    // let { finalPrice, priceTag } = getCabADAFinalPriceAndTag(p);
    p.finalPrice = p.price;
    p.priceTag = 'Excluded product';
    return p;
  }
  //determine competitor number
  let competitorList = getPriceListFrom8Competitors(p);
  switch (competitorList.length) {
    case 0:
      let result = getPriceWithNoCompetitor(p);
      p.finalPrice = result.finalPrice;
      p.priceTag = result.priceTag;
      break;
    case 1:
      let resultOne = getPriceWithOneCompetitor(p);
      p.finalPrice = resultOne.finalPrice;
      p.priceTag = resultOne.priceTag;
      break;
    default:
      let resultTwo = getPriceWithMoreThanTwoCompetitor(p);
      p.finalPrice = resultTwo.finalPrice;
      p.priceTag = resultTwo.priceTag;
  }
  return p;
}

// mainLogic(data[28760]);TODO: debug below

function getCabADAFinalPriceAndTag(p) {
  //NOT IN USE //for cable/adapter products, based on the object with lowest price and competitor, determin the finalPrice and give a priceTag
  let { competitor, minPrice } = getLowestPriceForCableAndAdaptor(p);
  if (competitor.length === 0 && minPrice === 0) {
    finalPrice = p.price;
    priceTag = 'cable/adapter no competitor, then keep original price';
    return { finalPrice: finalPrice, priceTag: priceTag };
  } else {
    finalPrice = minPrice;
    priceTag = `Final price matches $${minPrice} of ${competitor} `;
    return { finalPrice: finalPrice, priceTag: priceTag };
  }
}

function getPriceWithNoCompetitor(p) {
  //for products with no competitors, determin the finalPrice and priceTag based on supplier lowest price, or cost, in rare cases, neither is given then return ng
  let finalPrice = 0;
  let priceTag = '';
  let result = getSortedSupplierPriceList(p);

  if (result.length === 0 && p.cost !== 'ng') {
    finalPrice = parseFloat(p.cost * 1.2).toFixed(2);
    priceTag = `No competitor, no supplier, cost * 1.2`;
    return { finalPrice: finalPrice, priceTag: priceTag };
  } else if (result.length === 0 && p.cost === 'ng') {
    finalPrice = 'ng';
    priceTag = 'No competitor, no supplier, no cost';
    return { finalPrice: finalPrice, priceTag: priceTag };
  }
  let { supplier, price } = result[0];
  finalPrice = parseFloat(price * 1.2).toFixed(2);
  priceTag = `No competitor, supplier ${supplier} price * 1.2 `;
  return { finalPrice: finalPrice, priceTag: priceTag };
}

function getPriceWithOneCompetitor(p) {
  //for product with one competitor, determin the cost then compare the competitor price. return a finalPrice and a priceTag
  let cost = 0;
  let finalPrice = 0;
  let priceTag = '';
  let result = getSortedSupplierPriceList(p);

  if (result.length === 0 && p.cost !== 'ng') {
    cost = p.cost;
  }
  if (result.length === 0 && p.cost === 'ng') {
    finalPrice = 'ng';
    priceTag = 'No supplier, no cost';
    return { finalPrice: finalPrice, priceTag: priceTag };
  }
  if (result.length > 0) {
    let { price } = result[0];
    cost = price;
  }

  let competitorIncludeNoStock = getPriceListFrom8Competitors(p);
  let sortedCompetitorWithNoStock = competitorIncludeNoStock.sort((a, b) =>
    a.price > b.price ? 1 : -1
  );
  let competitorPriceList = getSortedPriceListFrom8Competitors(p);
  if (competitorPriceList.length === 0 && p.stock_ln === 'in stock') {
    //Our Company in stock competitor doesn't
    finalPrice = cost * 1.15;
    priceTag = `Our Company has stock competitors don't, final price = cost * 1.15`;
    return { finalPrice: finalPrice, priceTag: priceTag };
  } else if (competitorPriceList.length > 0) {
    //competitor in stock
    let { price } = competitorPriceList[0];
    if (price / cost < 1.05) {
      finalPrice = 'ng';
      priceTag = `Warning! ${competitorPriceList[0].competitor}'s price is lower than 5% margin.`;
      return { finalPrice: finalPrice, priceTag: priceTag };
    } else {
      finalPrice = price;
      priceTag = `Matching ${competitorPriceList[0].competitor}'s price with more than 5% margin.`;
      return { finalPrice: finalPrice, priceTag: priceTag };
    }
  } else if (
    sortedCompetitorWithNoStock[0].stock === 'ng' ||
    p.stock_ln === 'ng'
  ) {
    let { price } = sortedCompetitorWithNoStock[0];
    if (price / cost < 1.05) {
      finalPrice = 'ng';
      priceTag = `Warning! ${sortedCompetitorWithNoStock[0].competitor}'s price is lower than 5% margin.`;
      return { finalPrice: finalPrice, priceTag: priceTag };
    } else {
      finalPrice = price;
      priceTag = `Matching ${sortedCompetitorWithNoStock[0].competitor}'s price with more than 5% margin.`;
      return { finalPrice: finalPrice, priceTag: priceTag };
    }
  }
}

function getPriceWithMoreThanTwoCompetitor(p) {
  let finalPrice = 0;
  let priceTag = '';

  if (
    getSortedPriceListFrom8Competitors(p).length > 1 &&
    p.stock_ln === 'in stock'
  ) {
    let { lowerThanXYRate } = getXYlowerRateFor1st2nd(p);
    let lowestPrice = getSortedPriceListFrom8Competitors(p)[0].price;
    let secondPrice = getSortedPriceListFrom8Competitors(p)[1].price;
    priceTag = `${lowerThanXYRate ? ' Do ' : ' NOT '} lower than xy rate. `;

    if (lowerThanXYRate) {
      finalPrice = secondPrice * 0.99; //  TODO:    0.2 gap lower than the second price
      finalPrice = parseFloat(finalPrice).toFixed(2);
      priceTag = priceTag.concat(
        ` 99% of ${getSortedPriceListFrom8Competitors(p)[1].competitor} price `
      );
      return { finalPrice: finalPrice, priceTag: priceTag };
    } else {
      priceTag = priceTag.concat(
        ` Matching ${
          getSortedPriceListFrom8Competitors(p)[0].competitor
        } price. `
      );
      return { finalPrice: lowestPrice, priceTag: priceTag }; //match the lowest
    }
  } else if (
    getSortedPriceListFrom8Competitors(p).length === 1 &&
    p.stock_ln === 'in stock'
  ) {
    let cost = 0;
    let result = getSortedSupplierPriceList(p);

    if (result.length === 0 && p.cost !== 'ng') {
      cost = p.cost;
    }
    if (result.length === 0 && p.cost === 'ng') {
      finalPrice = 'ng';
      priceTag = 'No supplier, no cost';
      return { finalPrice: finalPrice, priceTag: priceTag };
    }
    if (result.length > 0) {
      let { price } = result[0];
      cost = price;
    }

    let { price, competitor } = getSortedPriceListFrom8Competitors(p)[0];
    if (price / cost < 1.05) {
      finalPrice = price;
      priceTag = `Matching ${competitor}'s price with more than 5% margin. `;
      return { finalPrice: finalPrice, priceTag: priceTag };
    } else {
      finalPrice = 'ng';
      priceTag = `Warning! ${competitor}'s price is lower than 5% margin.`;
      return { finalPrice: finalPrice, priceTag: priceTag };
    }
  } else if (
    getSortedPriceListFrom8Competitors(p).length === 0 &&
    p.stock_ln === 'in stock'
  ) {
    let cost = 0;
    let result = getSortedSupplierPriceList(p);

    if (result.length === 0 && p.cost !== 'ng') {
      cost = p.cost;
    }
    if (result.length === 0 && p.cost === 'ng') {
      finalPrice = 'ng';
      priceTag = 'No supplier, no cost';
      return { finalPrice: finalPrice, priceTag: priceTag };
    }
    if (result.length > 0) {
      let { price } = result[0];
      cost = price;
    }

    finalPrice = cost * 1.15;
    priceTag = 'No competitor in stock, cost *1.15';
    return { finalPrice: finalPrice, priceTag: priceTag };
  } else if (getSortedPriceListFrom8Competitors(p).length > 1) {
    let { lowerThanXYRate } = getXYlowerRateFor1st2nd(p);
    let lowestPrice = getSortedPriceListFrom8Competitors(p)[0].price;
    let secondPrice = getSortedPriceListFrom8Competitors(p)[1].price;
    priceTag = `${lowerThanXYRate ? ' Do ' : ' NOT '} lower than xy rate. `;

    if (lowerThanXYRate) {
      finalPrice = secondPrice * 0.99; //  TODO:    0.2 gap lower than the second price
      finalPrice = parseFloat(finalPrice).toFixed(2);
      priceTag = priceTag.concat(
        `Our Company no stock. 99% of ${
          getSortedPriceListFrom8Competitors(p)[1].competitor
        } price `
      );
      return { finalPrice: finalPrice, priceTag: priceTag };
    } else {
      priceTag = priceTag.concat(
        `Our Company has no stock. Matching ${
          getSortedPriceListFrom8Competitors(p)[0].competitor
        } price. `
      );
      return { finalPrice: lowestPrice, priceTag: priceTag }; //match the lowest
    }
  } else if (getSortedPriceListFrom8Competitors(p).length === 1) {
    let cost = 0;
    let result = getSortedSupplierPriceList(p);

    if (result.length === 0 && p.cost !== 'ng') {
      cost = p.cost;
    }
    if (result.length === 0 && p.cost === 'ng') {
      finalPrice = 'ng';
      priceTag = 'No supplier, no cost';
      return { finalPrice: finalPrice, priceTag: priceTag };
    }
    if (result.length > 0) {
      let { price } = result[0];
      cost = price;
    }

    let { price, competitor } = getSortedPriceListFrom8Competitors(p)[0];
    if (price / cost < 1.05) {
      finalPrice = price;
      priceTag = `Our Company has no stock. Matching ${competitor}'s price with more than 5% margin. `;
      return { finalPrice: finalPrice, priceTag: priceTag };
    } else {
      finalPrice = 'ng';
      priceTag = `Warning! Our Company has no stock. ${competitor}'s price is lower than 5% margin.`;
      return { finalPrice: finalPrice, priceTag: priceTag };
    }
  } else {
    finalPrice = p.price;
    priceTag =
      'Our Company has stock. Competitor out of stock. Keep original price';
    return { finalPrice: finalPrice, priceTag: priceTag };
  }
}

function getCategory(p) {
  //input a product, provides its first 3 digits of productId for category
  return p.productId.substring(0, 3);
}

function getPriceListFrom6Competitors(p) {
  //input a product, provides an object with 6 prices from competitors
  const allowed = sixCompetitorsList;
  const filtered = Object.keys(p)
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => {
      obj[key] = p[key];
      return obj;
    }, {});

  return filtered;
}

function getLowestPriceForCableAndAdaptor(p) {
  //from the object of getPriceListFromPCSPCM, provide an object contains the lowest price and competitor's name
  let competitorList = getPriceListFrom6Competitors(p);

  let competitor = '';
  let minPrice = 0;
  for (const [key, value] of Object.entries(competitorList)) {
    if ((value !== 'ng' && minPrice == 0) || value < minPrice) {
      minPrice = value;
      competitor = key;
    }
  }
  return { competitor, minPrice };
}

function getPriceListFrom8Competitors(p) {
  // input a product, privides an array of objects with competitor name, price and stock which are in the 8 competitor list
  let competitor = [];

  for (const [key, value] of Object.entries(p)) {
    if (fullCompetitorsList.includes(key) && value !== 'ng') {
      competitor.push({
        competitor: `${key}`,
        price: value,
        stock: p[`${key}_Stock`],
      });
    }
  }

  return competitor;
}

function getSortedPriceListFrom8Competitors(p) {
  //from the list of object with competitor name, price and stock, sort by the price then return a sorted list
  let competitor = getPriceListFrom8Competitors(p);

  let sortedByPrice = competitor.sort((a, b) => (a.price > b.price ? 1 : -1));

  let filteredPriceList = sortedByPrice.filter((p) => p.stock !== 'ng');

  return filteredPriceList;
}

function getSupplierPriceList(p) {
  //input a product, privides a array of objects with supplier name and price
  let supplierPriceList = [];

  for (const [key, value] of Object.entries(p)) {
    if (supplierList.includes(key)) {
      supplierPriceList.push({
        supplier: `${key}`,
        price: value,
      });
    }
  }

  return supplierPriceList;
}

function getSortedSupplierPriceList(p) {
  //from the list of supplier price of a given product, filter out suppliers with a price
  let supplierPriceList = getSupplierPriceList(p);

  let filteredSupplierPriceList = [];

  supplierPriceList.filter((s) => {
    if (s.price !== 'ng') {
      filteredSupplierPriceList.push(s);
    }
  });

  if (filteredSupplierPriceList.length === 1) return filteredSupplierPriceList;

  let sortedSupplierPriceList = filteredSupplierPriceList.sort((a, b) =>
    a.price > b.price ? 1 : -1
  );
  return sortedSupplierPriceList;
}

function getCheaperRateFor1st2nd(p) {
  //from sorted competitor price list, return an object contains lowerThan20Percent and tag. lowerThan20Percent can be true/false/same or in rare cases, ngnc(no competitor), ng1c(one competitor)
  let lowerThan20Percent = false;

  let competitorList = getSortedPriceListFrom8Competitors(p);

  if (competitorList.length === 0) {
    lowerThan20Percent = 'ngnc';
    return {
      lowerThan20Percent: lowerThan20Percent,
      tag: 'No competitor',
    };
  }

  if (competitorList.length === 1) {
    //only one competitor has stock, nothing to compare with, return ng
    lowerThan20Percent = 'ng1c';
    return {
      lowerThan20Percent: lowerThan20Percent,
      tag: 'Only one competitor',
    };
  }

  const cheaperRate =
    100 - (competitorList[0].price / competitorList[1].price) * 100;

  if (cheaperRate >= 20) {
    //cheaper rate 20
    lowerThan20Percent = true;
    tag = `${competitorList[0].competitor}'s price ${competitorList[0].price} is ${cheaperRate} lower than ${competitorList[1].competitor}'s price ${competitorList[1].price}`;
    return { lowerThan20Percent: lowerThan20Percent, tag: tag };
  } else if (competitorList[0].price !== competitorList[1].price)
    return {
      lowerThan20Percent: lowerThan20Percent,
      tag: 'Lower rate less than 20%',
    };
  else {
    return {
      lowerThan20Percent: 'same',
      tag: 'Same lowest price',
    };
  }
}

function getXYlowerRateFor1st2nd(p) {
  //from sorted competitor price list, return an object contains lowerThanXYRate and tag. lowerThanXYRate can be true/false, based on given critiera
  let lowerThanXYRate = false;
  let tag = '';

  let competitorList = getSortedPriceListFrom8Competitors(p);
  // if (competitorList.length < 1) return "ng";
  let xRate = 100 - (competitorList[0].price / competitorList[1].price) * 100;
  let yRate = competitorList[1].price - competitorList[0].price;

  tag = `Price is ${p.price}, x% = ${parseFloat(xRate).toFixed(
    2
  )}, $y  = ${parseFloat(yRate).toFixed(2)}}`;

  if (p.price >= 1500) {
    if (xRate > 2 || yRate > 50) {
      lowerThanXYRate = true;
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    } else {
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    }
  } else if (p.price >= 800 && p.price < 1500) {
    if (xRate > 3 || yRate > 30) {
      lowerThanXYRate = true;
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    } else {
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    }
  } else if (p.price >= 500 && p.price < 800) {
    if (xRate > 3 || yRate > 18) {
      lowerThanXYRate = true;
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    } else {
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    }
  } else if (p.price >= 300 && p.price < 500) {
    if (xRate > 4 || yRate > 15) {
      lowerThanXYRate = true;
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    } else {
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    }
  } else if (p.price >= 100 && p.price < 300) {
    if (xRate > 7 || yRate > 10) {
      lowerThanXYRate = true;
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    } else {
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    }
  } else {
    if (xRate > 10 || yRate > 8) {
      lowerThanXYRate = true;
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    } else {
      return { lowerThanXYRate: lowerThanXYRate, tag: tag };
    }
  }
}
