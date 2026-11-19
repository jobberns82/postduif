# Postduif

AirDrop-achtige bestandsuitwisseling tussen apparaten op hetzelfde netwerk. Draait in de browser.
De server regelt alleen het vinden van elkaar; bestanden gaan rechtstreeks tussen de browsers (WebRTC).

Starten: `docker compose up -d`, open daarna `http://SERVER-IP:5600` op beide apparaten.
Vinden ze elkaar niet (bijvoorbeeld door een VPN), gebruik dan rechtsboven dezelfde Koppelcode op beide.
