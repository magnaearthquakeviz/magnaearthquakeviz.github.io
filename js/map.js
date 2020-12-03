/**
 * Class representing the map view. 
 */
class Maps {
    /**
     * Creates a Maps Object
     *
     * Draw a basemap and add desired information to it.
     *
     * @param combinedData - All the earthquake data available
     * @param row - Row of the website to draw the map
     * @param column - Column of the website to draw the map
     */
    constructor(combinedData, row, column) {
        // map size
        this.width = this.height = 500;
        // seismometer size
        this.stationSymbolSize = 40;
        // Google Map Settings
        this.mainshockLoc = {lat: 40.751, lng: -112.078};
        this.googleZoom = 10.5;

        // Separate the data
        this.outlineData = combinedData[0];
        this.quakeData = combinedData[1];
        this.lakeData = combinedData[2];
        this.faultData = combinedData[3];
        this.stationData = combinedData[4];
        this.feltReportData = combinedData[5];
        
        // Filter felt report data to be in Utah Boundaries
        this.filteredFeltReports = this.feltReportData.features.filter(d => {
            let lat = +d.geometry.coordinates[1]
            let lon = +d.geometry.coordinates[0]
            if (lat > 41 & lat < 42 & lon < -111 & lon > -114)
                return d
            if (lat > 37 & lat < 41 & lon < -109 & lon > -114)
                return d
        });

        // Earthquake magnitude scale
        let magnitudeArray = d3.map(this.quakeData.features, d => d.properties.mag);
        this.magnitudeScale = d3.scaleSqrt()
            .domain(d3.extent(magnitudeArray))
            .range([0.01, 5]);
    
        // Color scale for intensity 
        this.intensityColorScale = d3.scaleLinear()
            .domain([1, 7.5])
            .range(['yellow', 'red'])
    
        this.projection = d3.geoConicConformal()
            .parallels([40 + 43 / 60, 41 + 47 / 60])
            .rotate([111 + 30 / 60, 0])
            .fitSize([this.width, this.height], this.outlineData);
    
        this.path = d3.geoPath().projection(this.projection);
        
        this.panel = '#panel' + row + '-' + column + ' > div.visArea';
        this.panelID = `panel${row}-${column}`;

        this.showSeismometers = true;
        this.showFelt = false;

        this.transition = function () {
            return d3.transition()
                .duration(750)
                .ease(d3.easeCubicOut);
        };

        this.googleMap = null;
    }

    /**
     * Draw a map in the shape of Utah
     */
    drawUtahBaseMap() {
        // Group for outline
        this.svg = d3.select(this.panel).append('svg');
        this.svg.attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('id', 'outlineG')
            .selectAll('path')
            .data(this.outlineData.features)
            .join('path')
            .attr('d', this.path);
    }

    /**
     * Add Utah lakes to a map
     */
    addLakes(svg) {
        // Group for water features - used to debug/make sure it was landing roughly in Magna
        this.svg.append('g')
            .attr('id', 'lakeG')
            .selectAll('path')
            .data(this.lakeData.features)
            .join('path')
            .attr('d', this.path)
            .style('fill', 'lightblue');
    }

    /**
     * Add Wasatch and West Valley faults to a map
     */
    addFaults(svg) {
        // Filter the fault data to only use the Wasatch and West Valley faults becuase there are a lot otherwise
        let faultsFiltered = this.faultData.features.filter(function (d) {
            return d.properties.Label.match(/Wasatch/) || d.properties.Label.match(/West Valley/)
        });

        this.svg.append('g')
            .attr('id', 'faultG')
            .selectAll('path')
            .data(faultsFiltered)
            .join('path')
            .attr('d', this.path)
            .attr('class', 'fault')
            .on('mouseenter', function () {
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
     * Create checkboxes for seismometer and felt report intensity data. 
     * Default is seismometers checked. 
     */
    addIntensityData(svg) {
        // add a group element for the intensity
        this.svg.append('g').attr('id', 'intensityG')

        // create a form element 
        let form = d3.select(this.panel).append('form');

        // add the felt report checkbox
        let that = this;

        let buttonDiv = form.append('div');
        let buttonCommonClasses = 'btn btn-outline-secondary mx-auto w-100';

        // Add button to show/hide felt reports
        buttonDiv.append('div')
            .classed('row d-flex justify-content-center', true)
            .append('div')
            .classed('col-sm-3 mt-2', true)
            .append('button')
            .classed(buttonCommonClasses, true)
            .classed('active', this.showFelt)
            .text(`${this.showFelt ? 'Hide' : 'Show'} Felt Reports`)
            .on('click', function () {
                d3.event.preventDefault();
                that.showFelt = !that.showFelt;
                d3.select(this)
                    .classed('active', that.showFelt)
                    .text(`${that.showFelt ? 'Hide' : 'Show'} Felt Reports`);
                if (that.showFelt) {
                    that.addFeltReports(svg);
                } else {
                    let selection = d3.select('#intensityG').selectAll('rect');
                    selection.transition(that.transition)
                        .attr('opacity', 0)
                        .remove();
                }
            });

        // Seismometers show up by default
        that.addSeismometers(svg);

        // Add button to show/hide seismometers
        buttonDiv.append('div')
            .classed('row d-flex justify-content-center', true)
            .append('div')
            .classed('col-sm-3 mt-2', true)
            .append('button')
            .classed(buttonCommonClasses, true)
            .classed('active', this.showSeismometers)
            .text(`${this.showSeismometers ? 'Hide' : 'Show'} Seismometers`)
            .on('click', function () {
                d3.event.preventDefault();
                that.showSeismometers = !that.showSeismometers;
                d3.select(this)
                    .classed('active', that.showSeismometers)
                    .text(`${that.showSeismometers ? 'Hide' : 'Show'} Seismometers`);
                if (that.showSeismometers) {
                    that.addSeismometers(svg);
                } else {
                    let selection = d3.select('#intensityG').selectAll('path');
                    selection.transition(that.transition)
                        .attr('opacity', 0)
                        .remove();
                }
            });
    }

    /**
     * Add University of Utah seismometers in Utah to a map as triangles
     */
    addSeismometers(svg) {
        // triangle symbol for the seismometers
        let triangle = d3.symbol().type(d3.symbolTriangle).size(this.stationSymbolSize)

        // filter the station data to only use UU stations in Utah
        // will likely need to filter more because there are a lot
        let statDataFiltered = this.stationData.features.filter((d) => {
            let channels = d.properties.channels.map(d => d.name)
            return d.id.match(/UU/) && d.properties.name.match(/UT/) //&& channels[0].match(/HH/)
        })
        let that = this
        // Group for the seismometers
        let triangles = this.svg.select('#intensityG')
            .selectAll('path')
            .data(statDataFiltered)
            .join('path')
            .attr('d', triangle)
            .classed('station', true)
            .attr('transform', function (d) {
                let coords = that.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])
                return 'translate(' + coords[0] + "," + coords[1] + ")"
            })
            .attr('opacity', 0);

        triangles.transition(this.transition)
            .attr('opacity', 1)
            .style('fill', d => this.intensityColorScale(d.properties.intensity));

        triangles.on('mouseenter', function () {
            let selected = d3.select(this);
            selected.append('title')
                .text(`${selected.datum().properties.name}\n`
                    + `Distance: ${selected.datum().properties.distance} km\n`
                    + `Intensity: ${selected.datum().properties.intensity}`);
        });

        triangles.on('mouseleave', function () {
            let selected = d3.select(this);
            selected.selectAll('title').remove();
        });
    }

    /**
     * Add felt reports by zipcode. Reported as a square that is sized by the number of reports.
     */
    addFeltReports(svg) {
        // Scale to the number of responses
        let nresp = this.feltReportData.features.map(d => (d.properties.nresp))
        let nrespScale = d3.scaleSqrt()
            .domain(d3.extent(nresp))
            .range([5, 12]);

        // TODO: Check that squares are sized appropriatley
        let rects = this.svg.select('#intensityG')
            .selectAll('rect')
            .data(this.filteredFeltReports)
            .join('rect')
            .classed('feltReport', true)
            .attr('x', d => this.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
            .attr('y', d => this.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
            .attr('height', d => nrespScale(d.properties.nresp))
            .attr('width', d => nrespScale(d.properties.nresp))
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .attr('fill', d => this.intensityColorScale(d.properties.cdi))
            .attr('opacity', 0);

        // Add animation to bringing them in
        rects.transition(this.transition)
            .attr('opacity', 1);

        rects.on('mouseenter', function () {
            let selected = d3.select(this);
            let zipcode = selected.datum().properties.name.split('<br>')[0]
            selected.attr('stroke-width', '2px');
            selected.append('title')
                .text(`Zipcode: ${zipcode}\nIntensity: ${selected.datum().properties.cdi}\n# Responses: ${selected.datum().properties.nresp}`);
        });

        rects.on('mouseleave', function () {
            let selected = d3.select(this);
            selected.attr('stroke-width', '1px');
            selected.selectAll('title').remove();
        });

        // Use this instead of above code to use circles instead of squares
        // this.svg.append('g')
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
     */
    addEarthquakes(svg) {
        // Selects the events the day of
        let quakeDataFiltered = this.quakeData.features.filter(d => (d.properties.time > 1584489600000 && d.properties.time < 1584576000000) && d.properties.mag > 2.0);

        // Group for earthquakes
        this.svg.append('g')
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
            .on('mouseenter', function () {
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
     */
    addMainShock(svg) {
        let mainQuake = this.quakeData.features[d3.maxIndex(this.quakeData.features, d => d.properties.mag)];
        let star = d3.symbol().type(d3.symbolStar).size(150);
        
        let g = this.svg.select('#mainShockG');
        if (g.empty()) {
            g = this.svg.append('g').attr('id', 'mainShockG')
        }

        let that = this
        g.selectAll('path')
            .data([mainQuake])
            .join('path')
            .attr('d', star)
            .attr('transform', function (d) {
                var coords = that.projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])
                return 'translate(' + coords[0] + "," + coords[1] + ")"
            })
            .style('fill', 'yellow')
            .attr('position', 'absolute')
            .on('mouseenter', function () {
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

    /* GOOGLE MAPS IMPLEMENTATION BELOW */

    /**
     * Draws the basic Google Map without any overlays.
     * @param style - Style of the map
     * @param zoom - Zoom level
     * @param center - Center of the map; coordinate pair array, i.e. [lat, lon]
     */
    drawBaseGoogleMap(style, zoom, center) {
        // Followed example from class map tutorial page
        d3.select(this.panel)
            .style('height', '500px')
            .style('width', '90%')
            .append('div').attr('id', `${this.panelID}-gMap`)
            .classed('googleMap', true);

        let mapContainer = d3.select(`#${this.panelID}-gMap`).node();

        let options = {
            center: {lat: center[0], lng: center[1]},
            zoom: zoom,
            mapTypeId: 'terrain',
            styles: style
        };

        this.googleMap = new google.maps.Map(mapContainer, options);
    }

    createFaultlineOverlay() {
        let faultsFiltered = this.faultData.features.filter(function (d) {
            return d.properties.Label.match(/Wasatch/) || d.properties.Label.match(/West Valley/)
        });

        faultsFiltered = {type: 'FeatureCollection', features: faultsFiltered};

        this.googleMap.data.setStyle(function (feature) {
            return ({
                strokeColor: 'red',
                strokeWeight: '2',
                opacity: 0.8
            });
        })

        this.googleMap.data.addGeoJson(faultsFiltered);

        let that = this;

        let infoWindow = new google.maps.InfoWindow({
            position: this.mainshockLoc
        });

        this.googleMap.data.addListener('mouseover', function (event) {
            that.googleMap.data.overrideStyle(event.feature, {strokeWeight: 5});
        });
        this.googleMap.data.addListener('mouseout', function (event) {
            that.googleMap.data.revertStyle();
        });

        this.googleMap.data.addListener('click', function (event) {
            infoWindow.close();
            infoWindow.setContent(event.feature.j.Label);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(that.googleMap);
        })
    }

    createMainShockOverlay() {
        let mainQuake = this.quakeData.features[d3.maxIndex(this.quakeData.features, d => d.properties.mag)];
        let star = d3.symbol().type(d3.symbolStar).size(150);

        let overlay = new google.maps.OverlayView();

        let that = this;

        // Add the container when the overlay is added to the map.
        overlay.onAdd = function () {
            let mainQuakeLayer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .attr("class", "map-mainq")
                .attr('id', `${this.panelID}-mainq`);

            overlay.onRemove = function () {
                d3.select('.map-mainq').remove();
            };

            overlay.draw = function () {
                let projection = this.getProjection(),
                    padding = 10;

                // Draw each marker as a separate SVG element.
                let marker = mainQuakeLayer.selectAll('svg')
                    .data([mainQuake]);

                let markerEnter = marker.enter().append("svg");

                // add the circle
                markerEnter.append("path");

                marker.exit().remove();

                marker = marker.merge(markerEnter);

                marker.each(transform)
                    .attr("class", "marker");

                marker.selectAll('path')
                    .attr('transform', `translate(${padding}, ${padding})`)
                    .attr('d', star)
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1px')
                    .style('fill', 'yellow')
                    .attr('position', 'absolute')
                    .on('mouseenter', function () {
                        let selected = d3.select(this);
                        let date = new Date(selected.datum().properties.time);
                        selected.append('title')
                            .text(`Main Earthquake:\n\t`
                            +`Magnitude: ${selected.datum().properties.mag}\n\t`
                            +`Time: ${date.toUTCString()}`);
                    })
                    .on('mouseleave', function () {
                        let selected = d3.select(this);
                        selected.selectAll('title').remove();
                    });

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
        overlay.setMap(this.googleMap);
    }

    /**
     * Create Google Maps overlay for cross section and applies to map.
     */
    createXSectionOverlay() {
        // Followed example from
        // https://developers.google.com/maps/documentation/javascript/examples/polyline-simple#maps_polyline_simple-javascript
        const crossSection = new google.maps.Polyline({
            path: [{lat: 40.725, lng: -112.221}, {lat: 40.789, lng: -111.850}],
            geodesic: true,
            strokeColor: 'black',
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });

        const Amarker = new google.maps.Marker({
            position: {lat: 40.725, lng: -112.221},
            map: this.googleMap,
            label: {
                color: 'white',
                fontWeight: 'bold',
                text: 'A',
                fontSize: '20px',
            },
        });

        const Bmarker = new google.maps.Marker({
            position: {lat: 40.789, lng: -111.850},
            map: this.googleMap,
            label: {
                color: 'white',
                fontWeight: 'bold',
                text: 'B',
                fontSize: '20px',
            },
        });

        // Add text box explaining markers
        // Followed this example: https://developers.google.com/maps/documentation/javascript/infowindows
        const contentAString =
        '<div id="Amarker content">' +
        "<p> Start of the cross-section line used in Panel 4.</p>" +
        "</div>";

        const infowindowA = new google.maps.InfoWindow({
            content: contentAString,
        });
        Amarker.addListener("click", () => {
            infowindowA.open(this.googleMap, Amarker)
        });

        const contentBString =
        '<div id="Bmarker content">' +
        "<p> End of the cross-section line used in Panel 4.</p>" +
        "</div>";

        const infowindowB = new google.maps.InfoWindow({
            content: contentBString,
        });
        Bmarker.addListener("click", () => {
            infowindowB.open(this.googleMap, Bmarker)
        });

        crossSection.setMap(this.googleMap);
    }

    /**
     * Create Google Maps overlay for earthquakes and applies to map.
     */
    createEarthquakeOverlay() {
        let overlay = new google.maps.OverlayView();

        let that = this;
        // Add the container when the overlay is added to the map.
        overlay.onAdd = function () {

            //to see all the available panes;
            console.log(this.getPanes());

            let quakeLayer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .attr("class", "map-quakes");

            overlay.onRemove = function () {
                d3.select('.map-quakes').remove();
                d3.select('.map-xsec').remove();
            };

            overlay.draw = function () {

                let projection = this.getProjection(),
                    padding = 10;

                // Draw each marker as a separate SVG element.
                let marker = quakeLayer.selectAll('svg')
                    .data(that.quakeData.features);

                let markerEnter = marker.enter().append("svg");

                // add the circle
                markerEnter.append("circle");

                marker.exit().remove();

                marker = marker.merge(markerEnter);

                marker.each(transform)
                    .attr("class", "marker");

                marker.selectAll('circle')
                    .attr('cx', padding)
                    .attr('cy', padding)
                    .attr('r', d => that.magnitudeScale(d.properties.mag))
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1px')
                    .attr('fill', 'red')
                    .on('mouseenter', function () {
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
        overlay.setMap(this.googleMap);
    }

    /**
     * Create Google maps overlay for seismometers
     * @returns {google.maps.OverlayView} Returns the overlay
     */
    createSeismometerOverlay() {
        let statDataFiltered = this.stationData.features.filter((d) => {
            let channels = d.properties.channels.map(d => d.name);
            return d.id.match(/UU/) && d.properties.name.match(/UT/);
        });
        let triangle = d3.symbol().type(d3.symbolTriangle).size(this.stationSymbolSize);

        let overlay = new google.maps.OverlayView();

        let that = this;

        // Add the container when the overlay is added to the map.
        overlay.onAdd = function () {
            let stationLayer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .attr("class", "map-stations")
                .attr('id', `${this.panelID}-seismometers`);

            overlay.onRemove = function () {
                d3.select('.map-stations').remove();
            };

            overlay.draw = function () {
                let projection = this.getProjection(),
                    padding = 10;

                // Draw each marker as a separate SVG element.
                let marker = stationLayer.selectAll('svg')
                    .data(statDataFiltered);

                let markerEnter = marker.enter().append("svg");

                // add the circle
                markerEnter.append("path");

                marker.exit().remove();

                marker = marker.merge(markerEnter);

                marker.each(transform)
                    .attr("class", "marker");

                marker.selectAll('path')
                    .attr('transform', `translate(${padding}, ${padding})`)
                    .attr('d', triangle)
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1px')
                    .style('fill', d => that.intensityColorScale(d.properties.intensity))
                    .on('mouseenter', function () {
                        let selected = d3.select(this);
                        selected.append('title')
                            .text(`${selected.datum().properties.name}\n`
                                + `Distance: ${selected.datum().properties.distance} km\n`
                                + `Intensity: ${selected.datum().properties.intensity}`);
                    })
                    .on('mouseleave', function () {
                        let selected = d3.select(this);
                        selected.attr('stroke-width', '1px');
                        selected.selectAll('title').remove();
                    });

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
        return overlay;
    }

    /**
     * Creates Google Maps overlay for felt reports.
     * @returns {google.maps.OverlayView} Returns the overlay
     */
    createFeltReportOverlay() {
        let nResp = this.feltReportData.features.map(d => (d.properties.nresp));
        let nrespScale = d3.scaleSqrt()
            .domain(d3.extent(nResp))
            .range([5, 12]);

        let overlay = new google.maps.OverlayView();

        let that = this;

        overlay.onAdd = function () {
            let feltReportLayer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .attr("class", "map-felt")
                .attr('id', `${this.panelID}-feltReports`);

            overlay.onRemove = function () {
                d3.select('.map-felt').remove();
            };

            overlay.draw = function () {
                let projection = this.getProjection(),
                    padding = 10;

                // Draw each marker as a separate SVG element.
                let marker = feltReportLayer.selectAll('svg')
                    .data(that.filteredFeltReports);

                let markerEnter = marker.enter().append("svg");

                // add the circle
                markerEnter.append("rect");

                marker.exit().remove();

                marker = marker.merge(markerEnter);

                marker.each(transform)
                    .attr("class", "marker");

                marker.selectAll('rect')
                    .attr('x', padding)
                    .attr('y', padding)
                    .attr('width', d => nrespScale(d.properties.nresp))
                    .attr('height', d => nrespScale(d.properties.nresp))
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1px')
                    .attr('fill', d => that.intensityColorScale(d.properties.cdi))
                    .on('mouseenter', function () {
                        let selected = d3.select(this);
                        let zipcode = selected.datum().properties.name.split('<br>')[0]
                        selected.attr('stroke-width', '2px');
                        selected.append('title')
                            .text(`Zipcode: ${zipcode}\n`
                                + `Intensity: ${selected.datum().properties.cdi}\n`
                                + `# Responses: ${selected.datum().properties.nresp}`);
                    })
                    .on('mouseleave', function () {
                        let selected = d3.select(this);
                        selected.attr('stroke-width', '1px');
                        selected.selectAll('title').remove();
                    });

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
        return overlay;
    }

    /**
     * Add overlays for seismometers and felt reports with buttons
     * to toggle their display.
     */
    addIntensityDataGMap() {
        let seismometerOverlay = this.createSeismometerOverlay();
        let feltReportOverlay = this.createFeltReportOverlay();

        // create a form element
        let form = d3.select(this.panel).append('form');

        // add the felt report checkbox
        let that = this;

        let buttonDiv = form.append('div');
        let buttonCommonClasses = 'btn btn-outline-secondary mx-auto w-100';

        // Add button to show/hide felt reports
        buttonDiv.append('div')
            .classed('row d-flex justify-content-center', true)
            .append('div')
            .classed('col-sm-3 mt-2', true)
            .append('button')
            .classed(buttonCommonClasses, true)
            .classed('active', this.showFelt)
            .text(`${this.showFelt ? 'Hide' : 'Show'} Felt Reports`)
            .on('click', function () {
                d3.event.preventDefault();
                that.showFelt = !that.showFelt;
                d3.select(this)
                    .classed('active', that.showFelt)
                    .text(`${that.showFelt ? 'Hide' : 'Show'} Felt Reports`);
                if (that.showFelt) {
                    feltReportOverlay.setMap(that.googleMap);
                } else {
                    feltReportOverlay.setMap(null);
                }
            });

        seismometerOverlay.setMap(this.googleMap);

        // Add button to show/hide seismometers
        buttonDiv.append('div')
            .classed('row d-flex justify-content-center', true)
            .append('div')
            .classed('col-sm-3 mt-2', true)
            .append('button')
            .classed(buttonCommonClasses, true)
            .classed('active', this.showSeismometers)
            .text(`${this.showSeismometers ? 'Hide' : 'Show'} Seismometers`)
            .on('click', function () {
                d3.event.preventDefault();
                that.showSeismometers = !that.showSeismometers;
                d3.select(this)
                    .classed('active', that.showSeismometers)
                    .text(`${that.showSeismometers ? 'Hide' : 'Show'} Seismometers`);
                if (that.showSeismometers) {
                    seismometerOverlay.setMap(that.googleMap);
                } else {
                    seismometerOverlay.setMap(null);
                }
            });
    }
}