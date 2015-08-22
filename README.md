# [evenow.com](http://www.evenow.com)

A real-time stats dashboard for Eve Online, pulling data from the [official EVE API](http://wiki.eveonline.com/en/wiki/EVE_API_Functions), [eve-central.com](http://dev.eve-central.com/evec-api/start), and other sources.

![evenow.com](http://www.evenow.com/img/screenshot.png)

## Built With

* [node](https://github.com/joyent/node)
* [less](https://github.com/cloudhead/less.js)
* [jquery](https://github.com/jquery/jquery)
* [moment](https://github.com/timrwood/moment/)
* [html5shiv](https://github.com/aFarkas/html5shiv)
* [skeleton](https://github.com/dhgamache/Skeleton)
* [normalize](https://github.com/necolas/normalize.css)
* [timeapi.org](http://www.timeapi.org/)

## Nuts and Bolts

Market data is filtered to include only the regions with the five highest-traffic trade hubs: 

* The Forge (Jita): id#10000002
* Domain (Amarr): id#10000043
* Heimatar (Rens): id#10000030
* Sinq Laison (Dodixie): id#10000032
* Metropolis (Hek): id#10000042

These filters were added primarily to work around an issue where EVE Central would sometimes fail on universe-wide queries. However, this also has the added benefit of limiting data to high-volume areas where there are less likely to be outliers.

## Contact

Watch the project here on github or follow [@evenowdotcom](http://www.twitter.com/evenowdotcom) to be notified of major updates.

If you want to get more involved, drop a line to [evenow@evenow.com](mailto:evenow@evenow.com).

Please document issues here on github.