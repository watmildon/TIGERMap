#!/bin/bash
cd "$(dirname "$0")"

rm *.pmtiles
rm *.pmtiles-journal
rm *.geojson
rm us-latest-addrstreet.osm.pbf
rm us-latest-tiger.osm.pbf

rm tilesets/us-latest.pmtiles
rm tilesets/us-latest-streetaddress.pmtiles
rm tilesets/washington-latest.pmtiles
rm tilesets/utah-latest.pmtiles

# download fresh extracts if we're in a new env
if [ ! -s us-latest.osm.pbf ] ; then
	echo "No us-latest.osm.pbf, downloading.."
	curl -O https://download.geofabrik.de/north-america/us-latest.osm.pbf
fi

if [ ! -s puerto-rico-latest.osm.pbf ] ; then
	echo "No puerto-rico-latest.osm.pbf, downloading.."
	curl -O https://download.geofabrik.de/north-america/us/puerto-rico-latest.osm.pbf
fi

if [ ! -s washington-latest.osm.pbf ] ; then
	echo "No washington-latest.osm.pbf, downloading.."
	curl -O https://download.geofabrik.de/north-america/us/washington-latest.osm.pbf
fi

if [ ! -s utah-latest.osm.pbf ] ; then
	echo "No utah-latest.osm.pbf, downloading.."
	curl -O https://download.geofabrik.de/north-america/us/utah-latest.osm.pbf
fi

# update existing extracts
pyosmium-up-to-date -v --server http://download.geofabrik.de/north-america/us-updates -s 10000 us-latest.osm.pbf
pyosmium-up-to-date -v --server http://download.geofabrik.de/north-america/us/puerto-rico-updates -s 10000 puerto-rico-latest.osm.pbf
pyosmium-up-to-date -v --server http://download.geofabrik.de/north-america/us/washington-updates -s 10000 washington-latest.osm.pbf
pyosmium-up-to-date -v --server http://download.geofabrik.de/north-america/us/utah-updates -s 10000 utah-latest.osm.pbf

# get timestamps
LAST_TIMESTAMP_US=$(osmium fileinfo -g header.option.timestamp us-latest.osm.pbf)
LAST_TIMESTAMP_WA=$(osmium fileinfo -g header.option.timestamp washington-latest.osm.pbf)
LAST_TIMESTAMP_UT=$(osmium fileinfo -g header.option.timestamp utah-latest.osm.pbf)

# generate US and PR tiger files
osmium tags-filter --remove-tags --overwrite us-latest.osm.pbf w/tiger:reviewed -o us-latest-tiger.osm.pbf
osmium export --attributes type,id,version,timestamp --overwrite us-latest-tiger.osm.pbf -o us-latest-tiger.geojson

osmium tags-filter --remove-tags --overwrite puerto-rico-latest.osm.pbf w/tiger:reviewed -o puerto-rico-latest-tiger.osm.pbf
osmium export --attributes type,id,version,timestamp --overwrite puerto-rico-latest-tiger.osm.pbf -o puerto-rico-latest-tiger.geojson

# generate US and PR tiger tile file
tippecanoe -zg -l highways -o us-latest.pmtiles --drop-densest-as-needed --extend-zooms-if-still-dropping us-latest-tiger.geojson puerto-rico-latest-tiger.geojson -N $LAST_TIMESTAMP_US

# generate US and PR addr:street files
osmium tags-filter --remove-tags --overwrite us-latest.osm.pbf nwr/addr:street -o us-latest-addrstreet.osm.pbf
osmium export --overwrite us-latest-addrstreet.osm.pbf -o us-latest-addrstreet.geojson

osmium tags-filter --remove-tags --overwrite puerto-rico-latest-tiger.osm.pbf nwr/addr:street -o puerto-rico-latest-addrstreet.osm.pbf
osmium export --overwrite puerto-rico-latest-addrstreet.osm.pbf -o puerto-rico-latest-addrstreet.geojson

# generate US and PR addr:street tile file
tippecanoe -zg -l streetaddress -o us-latest-streetaddress.pmtiles --drop-densest-as-needed --extend-zooms-if-still-dropping us-latest-addrstreet.geojson puerto-rico-latest-addrstreet.geojson -N $LAST_TIMESTAMP_US

# generate WAMap layer
osmium export --attributes type,id,version,timestamp washington-latest.osm.pbf -o washington-latest.geojson
tippecanoe -zg -l allFeatures -o washington-latest.pmtiles --drop-densest-as-needed --extend-zooms-if-still-dropping washington-latest.geojson -N $LAST_TIMESTAMP_WA

# generate UTMap layer
osmium export --attributes type,id,version,timestamp utah-latest.osm.pbf -o utah-latest.geojson
tippecanoe -zg -l allFeatures -o utah-latest.pmtiles --drop-densest-as-needed --extend-zooms-if-still-dropping utah-latest.geojson -N $LAST_TIMESTAMP_UT

# Shuffle everything into the upload dir
mv us-latest.pmtiles tilesets/us-latest.pmtiles
mv us-latest-streetaddress.pmtiles tilesets/us-latest-streetaddress.pmtiles
mv washington-latest.pmtiles tilesets/washington-latest.pmtiles
mv utah-latest.pmtiles tilesets/utah-latest.pmtiles

# Mirror everything to cloud host
rclone sync --transfers 1 --order-by size,descending --bwlimit 10M ~/TIGERProject/tilesets r2:tiger-map