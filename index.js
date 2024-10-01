const fs = require('fs');
const path = require('path');

function toDecimal(value, base) {
    return parseInt(value, base);
}

function lagrangeInterpolation(xValues, yValues, x) {
    let result = 0;
    for (let i = 0; i < xValues.length; i++) {
        let term = yValues[i];
        for (let j = 0; j < xValues.length; j++) {
            if (i !== j) {
                term = term * (x - xValues[j]) / (xValues[i] - xValues[j]);
            }
        }
        result += term;
    }
    return Math.round(result);
}

function evaluatePolynomial(xValues, yValues, x) {
    return lagrangeInterpolation(xValues, yValues, x);
}

function findWrongPoints(xValues, yValues, k) {
    const wrongPoints = [];
    
    const xSubset = xValues.slice(0, k);
    const ySubset = yValues.slice(0, k);
    
    console.log("\nChecking for wrong points in the data...");

    for (let i = 0; i < xValues.length; i++) {
        const x = xValues[i];
        const actualY = yValues[i];
        const expectedY = evaluatePolynomial(xSubset, ySubset, x);
        
        if (Math.abs(actualY - expectedY) > 1e-10) {
            wrongPoints.push({
                x: x,
                y: actualY,
                expectedY: expectedY
            });
        }
    }
    
    return wrongPoints;
}

function findSecret(jsonInput, isTestCase2 = false) {
    let xValues = [];
    let yValues = [];
    
    console.log("\nStarting to extract x and y values from the JSON input...");

    for (let key in jsonInput) {
        if (key !== 'keys') {
            let base = parseInt(jsonInput[key].base);
            let value = jsonInput[key].value;
            xValues.push(parseInt(key));
            yValues.push(toDecimal(value, base));
        }
    }
    
    console.log("\nValues extracted successfully:");
    console.log("  x values: ", xValues);
    console.log("  y values (converted to decimal):", yValues);
    
    let k = jsonInput.keys.k;
    console.log(`\nUsing the first ${k} x and y values for interpolation to find the secret.`);

    let xSubset = xValues.slice(0, k);
    let ySubset = yValues.slice(0, k);
    
   
    let secret = lagrangeInterpolation(xSubset, ySubset, 0);
    console.log(`\nThe secret derived from the interpolation is: ${secret}`);
    
    let wrongPoints = [];
    if (isTestCase2) {
        console.log("\nTest case 2 detected, checking for wrong points in the data...");
        wrongPoints = findWrongPoints(xValues, yValues, k);
    }
    
    return {
        secret: secret,
        wrongPoints: wrongPoints
    };
}

function processFiles(directoryPath) {
    console.log(`\nStarting the process of reading files from the directory: ${directoryPath}`);

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('\nError reading the directory:', err);
            return;
        }

        const jsonFiles = files.filter(file => path.extname(file) === '.json');
        if (jsonFiles.length === 0) {
            console.log('\nNo JSON files found in the directory. Please check the folder and try again.');
            return;
        }

        jsonFiles.forEach(file => {
            const filePath = path.join(directoryPath, file);
            console.log(`\nProcessing file: ${filePath}`);
            
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('\nError reading the file:', filePath, err);
                    return;
                }
                
                try {
                    console.log(`\nReading and parsing JSON from ${file}...`);
                    const jsonDocument = JSON.parse(data);
                    console.log(`\nSuccessfully parsed JSON from ${file}.`);
                  
                    const isTestCase2 = jsonDocument.keys.k === 6;
                    
                    const result = findSecret(jsonDocument, isTestCase2);
                    console.log(`\nThe secret derived from ${file} is: ${result.secret}`);
                    
                    if (isTestCase2 && result.wrongPoints.length > 0) {
                        console.log("\nWrong points found in the data:");
                        result.wrongPoints.forEach(point => {
                            console.log(`  Point (${point.x}, ${point.y}) is wrong. Expected y value: ${point.expectedY}`);
                        });
                    } else if (isTestCase2) {
                        console.log("\nNo wrong points found in the data.");
                    }
                    
                } catch (parseError) {
                    console.error('\nError parsing the JSON file:', filePath, parseError);
                }
            });
        });
    });
}

const directoryPath = './jsonFiles'; 
console.log("\nWelcome to the secret finder tool! Please place your JSON files in the specified folder.");
processFiles(directoryPath);
