/**
 * Class for an educational widget on earthquake equations
 */
class Widget {

    constructor(row, column) {
        // Magna Data
        this.magnaShearModulus = 3.3 * 10**10; // N/m^2
        this.magnaArea = 16; // km^2
        this.magnaDisplacement = 0.28; // m

        //slider bounds
        this.minArea = 1;
        this.maxArea = 50;
        this.minDisplacement = 0.01;
        this.maxDisplacement = 10;

        //Equations
        //   Moment = <shear modulus> * <area> * <slip>
        //   Moment magnitude = 2/3 log_10(<Moment>) - 6.07

        //Set up panel
        d3.select(`#panel${row}-${column}`).append('div')
            .classed('visArea', true);
        this.panel = `#panel${row}-${column} > div.visArea`;

        this.addWidgetSliders();

        this.drawWidget();

    }

    drawWidget() {

        let currentArea = +d3.select(`#${this.panelID}-area-slider`).node().noUiSlider.get();
        let currentDisplacement = +d3.select(`#${this.panelID}-displacement-slider`).node().noUiSlider.get();

        let radius = this.calculateRadius(this.magnaShearModulus, currentArea, currentDisplacement);


        let derp = 0;
    }

    calculateRadius(shearModulus, area, displacement) {
        // First calculate the magnitude

        let moment = shearModulus * area * displacement;
        let momentMagnitude = (2/3) * Math.log10(moment) - 6.07;
        console.log(momentMagnitude);
        if (momentMagnitude < 0) {
            return 1;
        }

        let radius = Math.sqrt(momentMagnitude / Math.PI);
        return radius;
    }

    addWidgetSliders() {
        let that = this;

        let form = d3.select(this.panel)
            .append('div')
            .classed('container-fluid', true)
            .append('form');

        let rowCommonClasses = 'form-group row d-flex justify-content-center flex-row';
        let sliderCommonClasses = 'col-md-5 my-auto ml-md-2 sliderDiv';

        let areaRow = form.append('div')
            .classed(rowCommonClasses, true);
        areaRow.append('label')
            .classed('mr-3 my-auto col-form-label', true)
            .text('Fault slip area:');
        let areaSlider = areaRow.append('div')
            .classed(`${sliderCommonClasses} area-slider`, true)
            .attr('id', `${this.panelID}-area-slider`)
        this.addWidgetSlider(areaSlider.node(), this.minArea, this.maxArea, this.magnaArea);

        let displacementRow = form.append('div')
            .classed(rowCommonClasses, true);
        displacementRow.append('label')
            .classed('mr-3 my-auto col-form-label', true)
            .text('Displacement:')
        let displacementSlider = displacementRow.append('div')
            .classed(`${sliderCommonClasses} displacement-slider`, true)
            .attr('id', `${this.panelID}-displacement-slider`);
        this.addWidgetSlider(displacementSlider.node(), this.minDisplacement, this.maxDisplacement, this.magnaDisplacement);
    }

    /**
     * Helper method. Adds a slider to a div with the given options.
     * @param div - div HTMLElement. This can be obtained by using
     * document.getElementById(...) or d3.select(...).node()
     * @param min - min of the range
     * @param max - max of the range
     * @param start - where to start the slider
     */
    addWidgetSlider(div, min, max, start) {
        noUiSlider.create(div,
            {
                start: start,
                connect: 'lower',
                behaviour: 'drag',
                //tooltips: [true, true],
                range: {
                    'min': min,
                    'max': max
                },
                // step: (max - min) / 200,
            });

        let that = this;

        div.noUiSlider.on('start', function (values, handle) {
            //todo: provide units in the labels of the sliders
            div.noUiSlider.updateOptions({
                tooltips: true
            });
        });

        div.noUiSlider.on('set', function (values, handle) {
            let sliders = d3.select(that.panel).selectAll('div.sliderDiv');

            let ranges = [];

            for (let node of sliders.nodes()) {
                ranges.push(node.noUiSlider.get());
            }

            for (let i = ranges.length; i < 4; i++) {
                ranges.push(null);
            }

            that.drawWidget();
        });

        div.noUiSlider.on('end', function (values, handle) {
            div.noUiSlider.updateOptions({
                tooltips: false
            });
        });
    }
}