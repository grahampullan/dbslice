//import { Box } from '../core/Box.js';
//import { MetaDataScatter } from './MetaDataScatter.js';
//import { MetaDataHistogram } from './MetaDataHistogram.js';
//import { MetaDataBarChart } from './MetaDataBarChart.js';


const filterPlots = [];
const dummyFilterId = "filter-id"
const dummyTitle = "title";

//const boxHistogram = new Box({x:0,y:0, width:300, height:300, component: new MetaDataHistogram({data:{filterId:dummyFilterId}, layout:{title:dummyTitle}  })});
const histogramDataNeeded = [ {name:"property", type:"continuous"}];
//filterPlots.push( {box:boxHistogram, dataNeeded:histogramDataNeeded} );
filterPlots.push( {name:"Histogram", dataNeeded:histogramDataNeeded} );

//const boxBarChart = new Box({x:300,y:0, width:300, height:300, component: new MetaDataBarChart({data:{filterId:dummyFilterId}, layout:{title:dummyTitle}  })});
const barChartDataNeeded = [ {name:"property", type:"categorical"}];
//filterPlots.push( {box:boxBarChart, dataNeeded:barChartDataNeeded} );
filterPlots.push( {name:"Bar chart", dataNeeded:barChartDataNeeded} );

//const boxScatter = new Box({x:600,y:0, width:200, height:200, component: new MetaDataScatter({data:{filterId:dummyFilterId}, layout:{title:dummyTitle}  })});
const scatterDataNeeded = [ {name:"xProperty", type:"continuous"}, {name:"yProperty", type:"continuous"}, {name:"cProperty", type:"categorical"}];
//filterPlots.push( {box:boxScatter, dataNeeded:scatterDataNeeded} );
filterPlots.push( {name:"Scatter plot", dataNeeded:scatterDataNeeded} );



export { filterPlots };