
const filterPlots = [];
const dummyFilterId = "filter-id"
const dummyTitle = "title";

const histogramDataNeeded = [ {name:"property", type:"continuous"}];
filterPlots.push( {name:"Histogram", dataNeeded:histogramDataNeeded} );

const barChartDataNeeded = [ {name:"property", type:"categorical"}];
filterPlots.push( {name:"Bar chart", dataNeeded:barChartDataNeeded} );

const scatterDataNeeded = [ {name:"xProperty", type:"continuous"}, {name:"yProperty", type:"continuous"}, {name:"cProperty", type:"categorical"}];
filterPlots.push( {name:"Scatter plot", dataNeeded:scatterDataNeeded} );

const rankCorrDataNeeded = [ {name:"outputProperty", type:"continuous"}, {name:"inputProperties", type:"continuous", array:true}];
filterPlots.push( {name:"Rank correlation", dataNeeded:rankCorrDataNeeded} );



export { filterPlots };