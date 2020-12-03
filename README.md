# Understanding the 2020 Magna, Utah Earthquake Sequence

## Team Members:
- [Alysha Armstrong](mailto:alysha.armstrong@utah.edu "alysha.armstrong@utah.edu")
- [Andrew Golightly](mailto:andrew.golightly@utah.edu "andrew.golightly@utah.edu")
- [Guy Watson](mailto:guy.watson@utah.edu "guy.watson@utah.edu")

## [Project Website](https://magnaearthquakeviz.github.io)

## Project Overview
We hope to create an effective and informative visualisation centered around the 2020 Magna Earthquake Sequence and the resulting aftershocks. In the aftermath of this earthquake, social media and the news were filled with misinformation and confusion about aftershocks, possibilities of a larger earthquake, and other similar items. We plan to create our visualisation as a way to explain and reduce many of the worries people have during earthquakes and their aftershocks by analyzing the Magna Sequence and its many aftershocks. 

## Repository Structure
- css: folder containing all the CSS used
    - external: folder containing all the external CSS libraries used
    - styles.css: custom CSS that we defined for the project
- Data: folder containing all the data used for generating the visualisations
- Documentation: folder containing all the documentation generated throughout the lifecycle of this project
- js: folder containing all the JS used
    - external: folder containing all the external JS libraries used
    - map.js: file used to draw map visualisations
    - scatter.js: file used to draw scatterplot visualisations
    - script.js: file used to initialize map and scatterplot visualisations and assign them to their correct sections
- index.html: file containing base HTML for the website 
- README.md: file containing project overview and additional information

## Documentation
- [Project Proposal](./Documentation/MagnaEarthquakeProject.pdf)
- [Feedback Exercise](./Documentation/feedback_exercise.md)
- [Project Review Feedback](./Documentation/TAMeeting11-18-20.md)
- [Process Book](./Documentation/ProcessBook.pdf)
- [Demo Video](https://www.youtube.com/embed/9t8oQYI2l-0)

## Data
- [Individual Earthquake Data](https://earthquake.usgs.gov/earthquakes/search/): Downloaded earthquakes near Magna, UT from 18 March 2020 - 04 November 2020
- [Felt Reports by ZIP](https://earthquake.usgs.gov/earthquakes/eventpage/uu60363602/dyfi/intensity): Estimated intensity for a zipcode based on USGS Felt Reports
- [Station Lists](https://earthquake.usgs.gov/earthquakes/eventpage/uu60363602/shakemap/intensity): Seismometers recording the mainshock event
- [Utah Quaternary Faults](https://geology.utah.gov/apps/qfaults/): Downloaded as a kmz file and converted to geoJson using [mygeodata.cloud](https://mygeodata.cloud/converter/kmz-to-json)
- Cross-Section Data: Used [The Generic Mapping Tools](https://www.soest.hawaii.edu/gmt/) pscoupe function to project the earthquakes onto the selected cross-section line
- Waveform Data from IRIS

## Resources
- GeoJSON files sourced from [opendata.gis.utah.gov](https://opendata.gis.utah.gov)
  - [State Boundary](https://opendata.gis.utah.gov/datasets/utah-state-boundary): filtered to ignore the mask and only contain the outline
  
  - [Lake Dataset](https://opendata.gis.utah.gov/datasets/utah-lakes-nhd): filtered to only use data categorized as ISMAJOR and INUTAH. 
- [Google Maps Javascript API](https://developers.google.com/maps/documentation/javascript/overview)
