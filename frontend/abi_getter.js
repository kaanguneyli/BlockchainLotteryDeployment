const fs = require('fs');
const path = require('path');

// Define the source and destination directories
const sourceDir = path.join(__dirname, '../artifacts/contracts');
const destDir = path.join(__dirname, '../frontend/ABIs');

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Function to extract and save ABI
const extractAndSaveABI = (sourceFilePath, destFileName) => {
  const sourceContent = fs.readFileSync(sourceFilePath, 'utf8');
  const sourceJson = JSON.parse(sourceContent);
  const abi = sourceJson.abi;

  const destFilePath = path.join(destDir, destFileName);
  fs.writeFileSync(destFilePath, JSON.stringify(abi, null, 2), 'utf8');
};

// List of facets to process
const facets = [
  'AdminFacet',
  'DiamondCutFacet',
  'DiamondLoupeFacet',
  'OwnershipFacet',
  'Test1Facet',
  'Test2Facet',
  'LotteryFacet',
  'QueryFacet'
];

// Process each facet
facets.forEach(facet => {
  const sourceFilePath = path.join(sourceDir, `${facet}.sol/${facet}.json`);
  if (!fs.existsSync(sourceFilePath)) {
    console.log(`File not found: ${sourceFilePath}`);
    return;
  }
  const destFileName = `${facet}.json`;
  extractAndSaveABI(sourceFilePath, destFileName);
});

console.log('ABI extraction and saving completed.');