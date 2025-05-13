
const axios = require('axios');
const csv = require('csvtojson');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const newman = require('newman');

const sheetURL = 'https://docs.google.com/spreadsheets/d/1FN7GT4j9D9sbUecNxxEfnQbxq87KEwWTOtXtHKaFn-M/export?format=csv&gid=0';

(async () => {
  try {
    // Step 1: Fetch and parse the sheet
    const response = await axios.get(sheetURL);
    const strategyData = await csv().fromString(response.data);

    // Step 2: Find the filtering row
    const conditionRow = strategyData.find(row =>
      (row.TestConditionToBeExecuted && row.TestConditionToBeExecuted.trim()) ||
      (row.TestCaseToBeExecuted && row.TestCaseToBeExecuted.trim())
    );

    if (!conditionRow) {
      throw new Error("No valid filter found in 'TestConditionToBeExecuted' or 'TestCaseToBeExecuted'");
    }

    const testConditionsRaw = (conditionRow.TestConditionToBeExecuted || '').trim().toLowerCase();
    const testCasesRaw = (conditionRow.TestCaseToBeExecuted || '').trim().toLowerCase();

    const executeAll = testConditionsRaw === 'executeall' || testCasesRaw === 'executeall';

    let conditionFilters = [];
    let isAndCondition = false;

    if (!executeAll && testConditionsRaw.includes('&')) {
      isAndCondition = true;
      conditionFilters = testConditionsRaw.split('&').map(s => s.trim());
    } else if (!executeAll && testConditionsRaw) {
      conditionFilters = testConditionsRaw.split(',').map(s => s.trim());
    }

    const directTestCases = !executeAll && testCasesRaw
      ? testCasesRaw.split(',').map(s => s.trim())
      : [];

    // Step 3: Filter strategyData and mark 'Execute'
    const filteredStrategy = strategyData.map(row => {
      let shouldExecute = false;
      const rowConditions = (row.Condition || '').toLowerCase();
      const rowTestCaseName = (row.TestCaseName || '').toLowerCase();

      if (executeAll) {
        shouldExecute = true;
      } else if (isAndCondition && conditionFilters.length > 0) {
        shouldExecute = conditionFilters.every(cond => rowConditions.includes(cond));
      } else if (conditionFilters.length > 0) {
        shouldExecute = conditionFilters.some(cond => rowConditions.includes(cond));
      }

      if (directTestCases.includes(rowTestCaseName)) {
        shouldExecute = true;
      }

      return {
        ...row,
        Execute: shouldExecute ? 'yes' : 'no'
      };
    });

    // Step 4: Save filtered strategy as CSV
    const strategyCsv = new Parser().parse(filteredStrategy);
    const filteredStrategyPath = path.join(__dirname, 'filtered_test_strategy.csv');
    fs.writeFileSync(filteredStrategyPath, strategyCsv);
    console.log(`Filtered strategy saved to ${filteredStrategyPath}`);

    // Step 5: Read test_data.json
    const testData = JSON.parse(fs.readFileSync('test_data.json'));
    const testCasesToRun = filteredStrategy
      .filter(tc => tc.Execute.toLowerCase() === 'yes')
      .map(tc => tc.TestCaseName);

    // Print test cases selected
    console.log(`🧪 Test cases selected for execution:\n${testCasesToRun.join('\n')}`);

    const filteredData = testData.filter(tc => testCasesToRun.includes(tc.TestCaseName));

    // Step 6: Save filtered test data
    fs.writeFileSync('filtered_test_data.json', JSON.stringify(filteredData, null, 2));
    console.log(`Created filtered_test_data.json with ${filteredData.length} test cases.`);

    // Step 7: Ensure reports directory exists
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    // Step 8: Run newman with filtered data
    newman.run({
      collection: require('./News_API_Automation.postman_collection.json'),
      iterationData: 'filtered_test_data.json',
      reporters: ['cli', 'html'],
      reporter: {
        html: { export: path.join(reportsDir, 'Newman_Run_Report.html') }
      }
    })
    .on('beforeRequest', (err, args) => {
      const iteration = args.cursor.iteration;
      const itemName = args.item.name;
      const data = filteredData[iteration];

      console.log(`\nIteration ${iteration + 1} - ${itemName}`);
      console.log('Input:');
      console.log(JSON.stringify(data, null, 2));
    })
    .on('done', (err, summary) => {
      if (err) {
        console.error('Newman run failed:', err);
        process.exit(1);
      }
      const failures = summary.run.failures.length;
      console.log(`\nNewman run complete. ${failures ? 'Some tests failed.' : 'All tests passed.'}`);
      console.log(`HTML report generated at: ${path.join(reportsDir, 'Newman_Run_Report.html')}`);
    });

  } catch (err) {
    console.error('⚠️ Error:', err.message);
  }
})();
