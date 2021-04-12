import {cfD3BarChart} from "../plot/cfD3BarChart.js"
import {cfD3Histogram} from "../plot/cfD3Histogram.js"
import {cfD3Scatter} from "../plot/cfD3Scatter.js"
import {cfD3Line} from "../plot/cfD3Line.js"
import {cfD3Contour2d} from "../plot/cfD3Contour2d.js"

export class plotRow {
		constructor(config){
			
			this.title = typeof(config.title) == "string" ? config.title : "New Plot Row!"
			this.type = ["plotter", "metadata"].includes( config.type ) ? config.type : "metadata"
			this.addPlotButton = {label : "Add plot"}
			this.grid = {nx: 12, ny: undefined}
			
			// Handle any specified plots.
			if(config.plots){
				
				this.plots = config.plots.reduce(function(acc, ctrl){
					// Try to instantiate all the plots.
					let plot = plotRow.instantiatePlot(ctrl)
					if(plot){
						acc.push(plot)
					} // if
					return acc
				}, [])
				
			} else {
				this.plots = []
			} // if
			
			
		} // constructor
		
		static instantiatePlot(ctrl){
			
			var plotCtrl = undefined;
			switch( ctrl.plottype ){
				
				case "cfD3BarChart":
					plotCtrl = cfD3BarChart.helpers.createDefaultControl()
					plotCtrl.view.yVarOption.val = ctrl.yProperty
					plotCtrl.view.gVar = ctrl.yProperty
				  break;
				
				case "cfD3Histogram":
					plotCtrl = cfD3Histogram.helpers.createDefaultControl()
					plotCtrl.view.xVarOption.val = ctrl.xProperty
				  break;
				  
				case "cfD3Scatter":
					plotCtrl = cfD3Scatter.helpers.createDefaultControl()
					plotCtrl.view.xVarOption.val = ctrl.xProperty
					plotCtrl.view.yVarOption.val = ctrl.yProperty
				  break;
				  
				case "cfD3Line":
					plotCtrl = cfD3Line.helpers.createDefaultControl()
					plotCtrl.view.sliceId = ctrl.sliceId
				  break;
				  
				case "cfD3Contour2d":
					plotCtrl = cfD3Contour2d.helpers.createDefaultControl()
					plotCtrl.view.sliceId = ctrl.sliceId
				  break;  
				default:
				  break;
			}; // switch

			
			return plotCtrl;
			
		} // instantiatePlot
		
		
	} // plotRow	
	