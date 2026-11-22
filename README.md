# Postduif

AirDrop-achtige bestandsuitwisseling tussen apparaten op hetzelfde netwerk. Draait in de browser.
De server regelt alleen het vinden van elkaar; bestanden gaan rechtstreeks tussen de browsers (WebRTC).

Starten: `docker compose up -d`, open daarna `http://SERVER-IP:5600` op beide apparaten.
Vinden ze elkaar niet (bijvoorbeeld door een VPN), gebruik dan rechtsboven dezelfde Koppelcode op beide.

Pincode: zet de omgevingsvariabele `PIN` (4 tot 8 cijfers, bijvoorbeeld in de stack-instellingen van Dockhand) om de app af te sluiten.
Na de juiste pincode blijft een apparaat 30 dagen binnen. Na 5 foute pogingen moet het 5 minuten wachten. Zonder `PIN` is de app open.
