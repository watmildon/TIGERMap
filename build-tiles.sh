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

# download fresh extracts if we're in a new env
if [ ! -s us-latest.osm.pbf ] ; then
	echo "No us-latest.osm.pbf, downloading.."
	curl -O https://download.geofabrik.de/north-america/us-latest.osm.pbf
fi

if [ ! -s puerto-rico-latest.osm.pbf ] ; then
	echo "No puerto-rico-latest.osm.pbf, downloading.."
	curl -O https://download.geofabrik.de/north-america/puerto-rico-latest.osm.pbf
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
pyosmium-up-to-date -v --server https://download.geofabrik.de/north-america/us-updates/ -s 10000 us-latest.osm.pbf
pyosmium-up-to-date -v --server https://download.geofabrik.de/north-america/us/puerto-rico-updates/ -s 10000 puerto-rico-latest.osm.pbf
pyosmium-up-to-date -v --server https://download.geofabrik.de/north-america/us/washington-updates/ -s 10000 washington-latest.osm.pbf
pyosmium-up-to-date -v --server https://download.geofabrik.de/north-america/us/utah-updates/ -s 10000 utah-latest.osm.pbf

# generate US and PR tiger files
osmium tags-filter --remove-tags --overwrite us-latest.osm.pbf w/tiger:reviewed=no -o us-latest-tiger.osm.pbf
osmium export --attributes type,id,version,timestamp --overwrite us-latest-tiger.osm.pbf -o us-latest-tiger.geojson

osmium tags-filter --remove-tags --overwrite puerto-rico-latest.osm.pbf w/tiger:reviewed=no -o puerto-rico-latest-tiger.osm.pbf
osmium export --attributes type,id,version,timestamp --overwrite puerto-rico-latest-tiger.osm.pbf -o puerto-rico-latest-tiger.geojson

# generate US and PR tiger tile file
tippecanoe -zg -l highways -o us-latest.pmtiles --drop-densest-as-needed us-latest-tiger.geojson puerto-rico-latest-tiger.geojson

# generate addr:street layer
osmium tags-filter --remove-tags --overwrite us-latest.osm.pbf nwr/addr:street -o us-latest-addrstreet.osm.pbf
osmium export --overwrite us-latest-addrstreet.osm.pbf -o us-latest-addrstreet.geojson
tippecanoe -zg -l streetaddress -o us-latest-streetaddress.pmtiles --drop-densest-as-needed us-latest-addrstreet.geojson

# generate WAMap layer
osmium export --attributes type,id,version,timestamp washington-latest.osm.pbf -o washington-latest.geojson
tippecanoe -zg -l allFeatures -o washington-latest.pmtiles --drop-densest-as-needed washington-latest.geojson

# generate UTMap layer
osmium export --attributes type,id,version,timestamp utah-latest.osm.pbf -o utah-latest.geojson
tippecanoe -zg -l allFeatures -o utah-latest.pmtiles --drop-densest-as-needed utah-latest.geojson

# Shuffle everything into the upload dir
mv us-latest.pmtiles tilesets/us-latest.pmtiles
mv us-latest-streetaddress.pmtiles tilesets/us-latest-streetaddress.pmtiles
mv washington-latest.pmtiles tilesets/washington-latest.pmtiles
mv utah-latest.pmtiles tilesets/utah-latest.pmtiles

# Mirror everything to cloud host
rclone sync --transfers 1 --order-by size,descending --bwlimit 10M ~/TIGERProject/tilesets r2:tiger-map