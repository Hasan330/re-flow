import _ from 'lodash';
import cartesian from './cartesian';
const types = ["suite", "subflow", "fork"];


const putInArray = array => {
  return array
  // return array.length === 1? array.map(item => [item]) : array;
}
  
const evaluateSubflow = function(name, getDetail) {
  const {suites, ...rest} = getDetail();
  if(!_.isArray(suites)) throw new Error(`no suites provided in subflow "${name}".`);
  
  
  const cartesianed = cartesian(
    ...suites.map(suite => [].concat(suite))
  ) || [];

  return cartesianed.map(combination => {
    return {
      name,
      type: 'subflow',
      ...rest,
      suites: combination,
    }
  })
}

const evaluateType = function(suite) {
  if(suite.type === "suite") {
    return [suite]
  }
  if(suite.type === "subflow") {
    const acc = [];
    suite.suites.forEach(subflowSuite => {
      acc.push([subflowSuite])
    })
    return acc
  }
  return suite
}


const evaluateFlow = function(name, suites) {
  if(!_.isArray(suites)) throw new Error(`no suites provided in flow "${name}".`);

  const formattedSuites = suites

    .reduce((acc, branch) => {

      if(_.isArray(branch)) {
        acc.push(branch);
      } else {
        acc.push([branch])
      }
      
      return acc;
    }, []);

  const cartesianed = cartesian(...formattedSuites);

  const conditionedCart = putInArray(cartesianed).map(combination => combination.reduce((acc, branch) => {
    if(branch.type === "subflow" && branch.condition) {
      const pass = branch.condition(acc);
      if(!pass) {
        return acc;
      }
    }
    acc.push(branch);
    return acc;
  }, []));

  return _.uniqWith(conditionedCart, _.isEqual);

}

export {
  evaluateFlow,
  evaluateSubflow,
}