
// https://www.sitepoint.com/javascript-object-creation-patterns-best-practises/

class DbsliceData {
  constructor() {
    this.data = undefined;
    this.flowData = [];
	this.session = {}
  }
}

export let dbsliceData = new DbsliceData();



