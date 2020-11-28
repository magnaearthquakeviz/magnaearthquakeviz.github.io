/**
 * Class representing the map view. 
 */
class Maps{
    /**
     * Creates a Maps Object 
     * 
     * Draw a basemap and add desired information to it.
     * 
     * @param combinedData - All the earthquake data available
     * @param row - Row of the website to draw the map 
     * @param column - Column of the website to draw the map
     */
    constructor(combinedData, row, column){
        this.width = this.height = 500;

        this.stationSymbolSize = 30;
        // this.mainshockLoc = {lat: 40.751, lng: -112.078};
        // this.googleZoom = 10.5;

        this.outlineData = combinedData[0];
        this.quakeData = combinedData[1];
        this.lakeData = combinedData[2];
        this.faultData = combinedData[3];
        this.stationData = combinedData[4];
        this.intensityData = combinedData[5];
        
        //console.log('data',this.intensityData)
        let magnitudeArray = d3.map(this.quakeData.features, d => d.properties.mag);

        this.magnitudeScale = d3.scaleSqrt()
            .domain(d3.extent(magnitudeArray))
            .range([0.01, 5]);
    
        this.intensityColorScale = d3.scaleLinear()
            .domain([1, 7])
            .range(['yellow', 'red'])
    
        this.projection = d3.geoConicConformal()
            .parallels([40 + 43 / 60, 41 + 47 / 60])
            .rotate([111 + 30 / 60, 0])
            .fitSize([this.width, this.height], this.outlineData);
    
        this.path = d3.geoPath().projection(this.projection);
        
        this.panel = '#panel' + row + '-' + column;
        console.log(this.panel);
    }

    /**
     * Draw a map in the shape of Utah 
     */
    drawUtahBaseMap(){
        let svg = d3.select(this.panel + ' > div.visArea')
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height);

        // Group for outline
        svg.append('g')
            .attr('id', 'outlineG')
            .selectAll('path')
            .data(this.outlineData.features)
            .join('path')
            .attr('d', this.path);

        return svg
    }

    /**
     * Add Utah lakes to a map
     * @param svg - svg element to add lakes to 
     */
    addLakes(svg){
        // Group for water features - used to debug/make sure it was landing roughly in Magna
        svg.append('g')
            .attr('id', 'lakeG')
            .selectAll('path')
            .data(this.lakeData.features)
            .join('path')
            .attr('d', this.path)
            .style('fill', 'lightblue');
    }

    /**
     * Add University of Utah seismometers in Utah to a map as triangles
     * @param svg - svg element to add seismometers to 
     */
    addSeismometers(svg){
        // triangle symbol for the seismometers 
        var triangle = d3.symbol().type(d3.symbolTriangle).size(this.stationSymbolSize)

        // filter the station data to only use UU stations in Utah 
        // will likely need to filter more because there are a lot 
        let statDataFiltered = this.stationData.features.filter((d)=>{
            let channels = d.properties.channels.map(d=>d.name)
            return d.id.match(/UU/) && d.properties.name.match(/UT/) //&& channels[0].match(/HH/)
        })
        let that = this
        // Group for the seismometers 
        svg.append('g')
            .attr('id', 'stationG')
            .selectAll('path')
            .data(statDataFiltered)
            .join('path')
            .attr('d', triangle)
            .classed('station', true)
            .attr('transform', function(d) {
                var coords = that.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])
                return 'translate('+coords[0] + "," + coords[1] + ")"
            })
            .style('fill', d => this.intensityColorScale(d.properties.intensity))
            .on('mouseenter', function(){
                let selected = d3.select(this);
                selected.attr('stroke-width', '3px');
                selected.append('title')
                .text(`${selected.datum().properties.name}\nDistance: ${selected.datum().properties.distance} km\nIntensity: ${selected.datum().properties.intensity}`);
            })
            .on('mouseleave', function () {
                let selected = d3.select(this);
                selected.selectAll('title').remove();
            });
    }

    /**
     * Add Wasatch and West Valley faults to a map
     * @param svg - svg element to add faults to
     */
    addFaults(svg){
        // Filter the fault data to only use the Wasatch and West Valley faults becuase there are a lot otherwise 
        let faultsFiltered = this.faultData.features.filter(function(d) {
            return d.properties.Label.match(/Wasatch/) || d.properties.Label.match(/West Valley/)});

        svg.append('g')
            .attr('id', 'faultG')
            .selectAll('path')
            .data(faultsFiltered)
            .join('path')
            .attr('d', this.path)
            .attr('class', 'fault')
            .on('mouseenter', function(){
                let selected = d3.select(this);
                selected.append('title')
                    .text(`${selected.datum().properties.Label}`);
            })
            .on('mouseleave', function () {
                let selected = d3.select(this);
                selected.selectAll('title').remove();
            });
    }

    /**
     * Add felt reports by zipcode. Reported as a square that is sized by the number of reports. 
     * @param svg - svg element to add felt reports to
     */
    addFeltReports(svg){
        // Scale to the number of responses
        let nresp = this.intensityData.features.map(d => (d.properties.nresp))
        let nrespScale = d3.scaleSqrt()
            .domain(d3.extent(nresp))
            .range([4, 10]);


        // Filter data to be in Utah Boundaries
        let filtered = this.intensityData.features.filter(d => {
            let lat = +d.geometry.coordinates[1]
            let lon = +d.geometry.coordinates[0]
            if (lat > 41 & lat < 42 & lon < -111 & lon > -114)
                return d
            if (lat > 37 & lat < 41 & lon < -109 & lon > -114)
                return d
        });

        // TODO: Check that squares are sized appropriatley 
        svg.append('g')
            .attr('id', 'intensityG')
            .selectAll('rect')
            .data(filtered)
            .join('rect')
            .attr('x', d=>this.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
            .attr('y', d=> this.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
            .attr('height', d => nrespScale(d.properties.nresp))
            .attr('width', d => nrespScale(d.properties.nresp))
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('fill', d => this.intensityColorScale(d.properties.cdi))
            .on('mouseenter', function() {
                let selected = d3.select(this);
                let zipcode = selected.datum().properties.name.split('<br>')[0]
                selected.attr('stroke-width', '3px');
                selected.append('title')
                    .text(`Zipcode: ${zipcode}\nIntensity: ${selected.datum().properties.cdi}\n# Responses: ${selected.datum().properties.nresp}`);
            })
            .on('mouseleave', function () {
                d3.select('#quakeG')
                    .selectAll('circle')
                    .attr('opacity', '1');

                let selected = d3.select(this);
                selected.attr('stroke-width', '1px');
                selected.selectAll('title').remove();
            });
        
        // Use this instead of above code to use circles instead of squares
        // svg.append('g')
        //     .attr('id', 'intensityG')
        //     .selectAll('circle')
        //     .data(filtered)
        //     .join('circle')
        //     .attr('cx', d => this.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
        //     .attr('cy', d => this.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
        //     .attr('r', d => nrespScale(d.properties.nresp))
        //     .attr('stroke', 'black')
        //     .attr('stroke-width', '1px')
        //     .attr('fill', 'red')
    }

    /**
     * Add all the Magna earthquakes to a map as circles
     * @param svg - svg element to add earthquakes to
     */
    addEarthquakes(svg){
        // Selects the events the day of
        let quakeDataFiltered = this.quakeData.features.filter(d => (d.properties.time > 1584489600000 && d.properties.time < 1584576000000) && d.properties.mag > 2.0);

        console.log(quakeDataFiltered);

        // Group for earthquakes
        svg.append('g')
            .attr('id', 'quakeG')
            .selectAll('circle')
            .data(quakeDataFiltered)
            .join('circle')
            .attr('cx', d => this.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
            .attr('cy', d => this.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
            .attr('r', d => this.magnitudeScale(d.properties.mag))
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('fill', 'red')
            .on('mouseenter', function() {
                d3.select('#quakeG')
                    .selectAll('circle')
                    .attr('opacity', '0.5');

                let selected = d3.select(this);


                let date = new Date(selected.datum().properties.time);

                selected.attr('stroke-width', '3px');
                selected.append('title')
                    .text(`Magnitude: ${selected.datum().properties.mag}\nTime: ${date.toUTCString()}`);
            })
            .on('mouseleave', function () {
                d3.select('#quakeG')
                    .selectAll('circle')
                    .attr('opacity', '1');

                let selected = d3.select(this);
                selected.attr('stroke-width', '1px');
                selected.selectAll('title').remove();
            });
    }


    /**
     * Add Magna mainshock to a map as a star
     * @param svg - svg element to add mainshock to
     */
    addMainShock(svg){
        let mainQuake = this.quakeData.features[d3.maxIndex(this.quakeData.features, d => d.properties.mag)];
        var star = d3.symbol().type(d3.symbolStar).size(150)
        let that = this
        svg.append('g')
            .attr('id', 'mainShockG')
            .selectAll('path')
            .data([mainQuake])
            .join('path')
            .attr('d', star)
            .attr('transform', function(d) {
                var coords = that.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])
                return 'translate('+coords[0] + "," + coords[1] + ")"
            })
            .style('fill', 'yellow')
            .on('mouseenter', function() {
                let selected = d3.select(this);
                let date = new Date(selected.datum().properties.time);
                selected.append('title')
                    .text(`Magnitude: ${selected.datum().properties.mag}\nTime: ${date.toUTCString()}`);
            })
            .on('mouseleave', function () {
                let selected = d3.select(this);
                selected.selectAll('title').remove();
            });
    }

    /**
     * Draw a Google Map that shows all the aftershocks 
     */
    drawGoogleMap(){
        console.log(this.panel + ' > div.visArea')
        d3.select(this.panel + ' > div.visArea')
            .style('height', '500px')
            .append('div').attr('id','googleMap')

        let mapContainer = d3.select('#googleMap').node()

        let options = {
            center:{lat: 40.751, lng: -112.078},
            zoom: 10.5, 
            mapTypeId: 'terrain' }
        
         let map = new google.maps.Map(mapContainer, options)

        let overlay = new google.maps.OverlayView();

        let that = this
        // Add the container when the overlay is added to the map.
        overlay.onAdd = function () {

            //to see all the available panes;
            console.log(this.getPanes());

            let layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .attr("class", "map-quakes");

            overlay.onRemove = function () {
                d3.select('.map-quakes').remove();
            };

            overlay.draw = function () {

                let projection = this.getProjection(),
                    padding = 10;


                // Draw each marker as a separate SVG element.
                // We could use a single SVG, but what size would it have?
                let marker = layer.selectAll('svg')
                    .data(that.quakeData.features);

                let markerEnter = marker.enter().append("svg");

                // add the circle
                markerEnter.append("circle");

                marker.exit().remove();

                marker = marker.merge(markerEnter);

                marker
                    .each(transform)
                    .attr("class", "marker");

                marker.selectAll('circle')
                    .attr('cx', padding)
                    .attr('cy', padding)
                    .attr('r', d => that.magnitudeScale(d.properties.mag))
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1px')
                    .attr('fill', 'red')
                    .on('mouseenter', function() {
                        d3.select('.map-quakes')
                            .selectAll('circle')
            
                        let selected = d3.select(this);
            
            
                        let date = new Date(selected.datum().properties.time);
            
                        selected.attr('stroke-width', '3px');
                        selected.append('title')
                            .text(`Magnitude: ${selected.datum().properties.mag}\nTime: ${date.toUTCString()}`);
                    })
                    .on('mouseleave', function () {
                        d3.select('.map-quakes')
                            .selectAll('circle')
            
                        let selected = d3.select(this);
                        selected.attr('stroke-width', '1px');
                        selected.selectAll('title').remove();
                    })
        
                //transforms the markers to the right
                // lat / lng using the projection from google maps
                    function transform(d) {
                        d = new google.maps.LatLng(+d.geometry.coordinates[1], +d.geometry.coordinates[0]);
                        d = projection.fromLatLngToDivPixel(d);
                        return d3.select(this)
                            .style("left", (d.x - padding) + "px")
                            .style("top", (d.y - padding) + "px");
                    }
            }
        }
        // Bind our overlay to the map…
        overlay.setMap(map);
    }
}