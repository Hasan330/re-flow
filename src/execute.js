import MochaRefow from './mocha-reflow';
import _ from 'lodash'
import decache from 'decache';
import threadPool from './thread-pool'
import path from 'path'
const workerPath = path.join(__dirname, './worker.js');

let allSuites;
const decacheSuiteDefinitions = function() {
  Object.values(allSuites).forEach(decache)
}

const getSuiteDefinition = function(name) {
  return allSuites[name]
}
const setSuiteDefinitions = function(suites) {
  allSuites = suites;
}

let mochaReflowInstance;

const executeSuite = ({ name }) => {
  // const suiteDescriptor = allSuites[name];
  const suitePath = getSuiteDefinition(name)

  if (!suitePath)
    throw new Error(`no suites specified in flow "${name}".`);

  // if(name === "NOOP") {
  //   return suiteDescriptor();
  // }
  return mochaReflowInstance.addFile(suitePath);
  // describe(name, suiteDescriptor);
};


const mochaConfig = {
  reporter: function() {

  }
}

const runReflowInstance = function () {
  return new Promise((resolve, reject) => {
    mochaReflowInstance.run(function(failures) {
      if(failures) return reject(failures);
      resolve();
    })
  })
}
const executeTree = function(tree, done) {
  const treeName = tree.name;
  if(tree.type === "fork") {
    console.log('forking: ', treeName)
    mochaReflowInstance = new MochaRefow(tree, mochaConfig)
  }

  // const suites = _.isArray(tree.suites)? tree.suites : [tree.suites];
  const suites = [].concat(tree.suites);
  

  // suites.forEach(branch => {
  //   const suitePath = getSuiteDefinition(treeName)
  //   mochaReflowInstance.addFile(suitePath);
  // })
  suites.forEach(executeSuites);

  mochaReflowInstance.run(done)
  
  return mochaReflowInstance
  // describe(treeName, function() {
  //   executeMochaHooks(tree)
  //   suites.forEach(executeSuites);
  // })
}

const executeSuites = function(branch) {
  if(branch.type === "suite") {
    // console.log('branch::', branch)
    return executeSuite(branch);
  }

  return executeTree(branch);
}

const executeMatrix = function(matrix, config) {
  const {
    testRunner,
    suiteDefinitions,
    forkHooks,
    detail,
    name,
  } = config;

  global.describe = testRunner;
  setSuiteDefinitions(suiteDefinitions);

  const totalForks = matrix.length;
  const normalizedMatrix = matrix.map((tree, i) => ({
    name: `${name}: fork #${i+1}/${totalForks}`,
    ...detail,
    suites: tree,
    type: "tree",
  }))

  
  const pool = threadPool({
    // threadsToSpawn: 1,
    workerPath,
  });
  pool.send(2)
  
  console.log(`${name}: (${totalForks} total flows)`)

  normalizedMatrix.forEach(executeTree);

  
}

export default executeMatrix
export {
  runReflowInstance,
  setSuiteDefinitions,
  decacheSuiteDefinitions,
  getSuiteDefinition,
  executeTree,
}
