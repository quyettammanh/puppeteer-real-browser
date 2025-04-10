/**
 * Script to check user filtering by modules
 */
const { testUserFiltering } = require('./utils/testUserModules');

// Run tests for different exam types and module combinations
async function runTests() {
  console.log('\n=== Test 1: All Modules (Reading-Listening-Writing-Speaking) ===');
  await testUserFiltering('hcm_b2', 'Reading-Listening-Writing-Speaking');
  
  console.log('\n=== Test 2: Only Reading ===');
  await testUserFiltering('hcm_b2', 'Reading');
  
  console.log('\n=== Test 3: Only Speaking ===');
  await testUserFiltering('hcm_b2', 'Speaking');
  
  console.log('\n=== Test 4: Reading and Writing ===');
  await testUserFiltering('hcm_b2', 'Reading-Writing');
  
  console.log('\n=== Test 5: Listening and Speaking ===');
  await testUserFiltering('hcm_b2', 'Listening-Speaking');
}

// Run the tests
runTests()
  .then(() => {
    console.log('\nAll tests completed. Verify that users are being filtered correctly.');
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  }); 