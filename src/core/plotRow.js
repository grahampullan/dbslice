import { dbsliceData } from './dbsliceData.js';
import { update } from './update.js';
import * as d3 from 'd3';
import { icon } from '@fortawesome/fontawesome-svg-core'
import { faDownLeftAndUpRightToCenter, faUpRightAndDownLeftFromCenter, faPlus } from '@fortawesome/free-solid-svg-icons'

const plotRow = {

    make : function() {

        const plotRowDiv = d3.select(`#${this.parentId}`).append("div")
            .datum({_id:this._id})
            .attr( "class", "card bg-light plot-row" )
            .attr( "id", `plot-row-${this._id}`)
            .attr( "style" , "margin-bottom:20px" )
            .attr( "plot-row-index", this.plotRowIndex );

        const plotRowHeaderDiv = plotRowDiv.append("div")
            .attr( "class", "card-header plot-row-title" )
            .style( "vertical-align", "middle" )
            .style( "display", "inline-block" )

        let html = `<h3 style='display:inline'>${this.title}</h3>`;
        if ( this.headerButton !== undefined ){
            html += `<button class='btn btn-success float-right' id='${d.headerButton.id}'>${d.headerButton.label}</button>`
        }
        plotRowHeaderDiv.html(html);

        if (this.addPlotButton) {
            plotRowHeaderDiv.append("button")
                .attr("class", "btn add-plot icon")
                .attr("data-bs-toggle","modal")
                .attr("data-bs-target","#addPlotModal")
                .style("float", "right")
                .html(icon(faPlus).html)
                .on("click", function(d){
                    d3.event.stopPropagation();
                    dbsliceData.modal.currentPlotRow = this;
                    dbsliceData.modal.show();
            })
        }
        
        const plotRowBodyDiv = plotRowDiv.append("div")
            .attr( "class", "row no-gutters g-1 plot-row-body" )
            .attr( "id", `plot-row-body-${this._id}`)
            .attr ("plot-row-index", this.plotRowIndex );

	    plotRowHeaderDiv.append("button")
            .attr("class", "btn collapseRow icon")
            .style("float", "right")
            .style("cursor", "pointer")
            .html(icon(faDownLeftAndUpRightToCenter).html)
            .on("click", function(){
                // Add in the functionality to collapse/expand the corresponding plot-row-body.
                let elementToCollapse = plotRowBodyDiv.node();
                let isHidden = elementToCollapse.style.display === "none";
                elementToCollapse.style.display = isHidden ? "" : "none";
                // Change the button icon
                this.innerHTML = isHidden ? icon(faDownLeftAndUpRightToCenter).html : icon(faUpRightAndDownLeftFromCenter).html;
                update()
            });
 
    },

}

const plotRowMakeForD3Each = function( d, i ) {

    d.plotRowIndex = i;
    d.make();

}

export { plotRow, plotRowMakeForD3Each };